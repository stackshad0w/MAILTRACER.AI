import tls from "node:tls";
import { validateSafeUrl } from "./ssrf-filter";
import { detectLookalikeDomain } from "./domain-intel";
import { RiskVerdict } from "./types";

export interface WebsiteScanResult {
  targetUrl: string;
  effectiveUrl: string;
  httpStatus?: number;
  redirectChain: string[];
  tls: {
    issuer?: string;
    subject?: string;
    validTo?: string;
    isTrusted: boolean;
  };
  securityHeaders: {
    hasHsts: boolean;
    hasCsp: boolean;
    hasXFrameOptions: boolean;
    hasContentTypeOptions: boolean;
  };
  contentAnalysis: {
    pageTitle?: string;
    hasLoginForm: boolean;
    hasPasswordInput: boolean;
    brandDetected?: string;
    phishingFlags: string[];
  };
  verdict: RiskVerdict;
  riskScore: number;
  confidence: number;
  explanation: string;
}

/**
 * Connects via TLS socket to read peer certificate metadata
 */
async function inspectTlsCertificate(hostname: string, port = 443): Promise<{
  issuer?: string;
  subject?: string;
  validTo?: string;
  isTrusted: boolean;
}> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 4000,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        socket.end();

        const getStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v);
        resolve({
          issuer: getStr(cert.issuer?.O) || getStr(cert.issuer?.CN) || "Unknown Authority",
          subject: getStr(cert.subject?.CN) || hostname,
          validTo: cert.valid_to,
          isTrusted: authorized,
        });
      }
    );

    socket.on("error", () => {
      resolve({ isTrusted: false });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ isTrusted: false });
    });
  });
}

/**
 * Safely scans an external public website with SSRF protection, TLS inspection, and HTML parsing
 */
export async function scanWebsite(rawUrl: string): Promise<WebsiteScanResult> {
  const ssrfCheck = await validateSafeUrl(rawUrl);
  if (!ssrfCheck.isValid) {
    throw new Error(ssrfCheck.error || "URL violates SSRF security boundary.");
  }

  const parsedUrl = new URL(rawUrl);
  const hostname = parsedUrl.hostname;
  const redirectChain: string[] = [rawUrl];

  // 1. Inspect TLS if HTTPS
  let tlsInfo = { isTrusted: false };
  if (parsedUrl.protocol === "https:") {
    tlsInfo = await inspectTlsCertificate(hostname, parsedUrl.port ? parseInt(parsedUrl.port) : 443);
  }

  // 2. Safe HTTP Fetch with timeout & max size limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  let response: Response;
  let responseText = "";
  let httpStatus = 0;
  let effectiveUrl = rawUrl;

  try {
    response = await fetch(rawUrl, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MailTracer-Forensics/1.0 (+https://mailtracer.ai)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    httpStatus = response.status;
    effectiveUrl = response.url;
    if (effectiveUrl !== rawUrl) {
      redirectChain.push(effectiveUrl);
    }

    // Read only up to 512KB to protect serverless memory
    const reader = response.body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          totalBytes += value.length;
          if (totalBytes > 512 * 1024) break; // cap 512KB
        }
      }
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      responseText = new TextDecoder("utf-8").decode(combined);
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    // If external site unreachable, analyze domain statically
    const lookalike = detectLookalikeDomain(hostname);
    return {
      targetUrl: rawUrl,
      effectiveUrl: rawUrl,
      httpStatus: 0,
      redirectChain,
      tls: tlsInfo,
      securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false, hasContentTypeOptions: false },
      contentAnalysis: {
        pageTitle: undefined,
        hasLoginForm: false,
        hasPasswordInput: false,
        brandDetected: lookalike.impersonatedBrand,
        phishingFlags: lookalike.isLookalike ? ["Lookalike Domain Stem"] : ["Host Unreachable / Offline"],
      },
      verdict: lookalike.isLookalike ? "HIGH_RISK" : "INCONCLUSIVE",
      riskScore: lookalike.isLookalike ? 75 : 45,
      confidence: 80,
      explanation: `Target host unreachable (${err instanceof Error ? err.message : "Connection timeout"}). Domain analysis: ${lookalike.reason || "No obvious brand impersonation detected."}`,
    };
  }

  // 3. Security Headers Evaluation
  const headers = response.headers;
  const hasHsts = headers.has("strict-transport-security");
  const hasCsp = headers.has("content-security-policy");
  const hasXFrameOptions = headers.has("x-frame-options");
  const hasContentTypeOptions = headers.has("x-content-type-options");

  // 4. Content DOM Analysis
  const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

  const hasPasswordInput = /<input[^>]+type=["']password["']/i.test(responseText);
  const hasLoginForm =
    hasPasswordInput ||
    (/<form/i.test(responseText) && /(login|signin|log-in|sign-in|authenticate)/i.test(responseText));

  const phishingFlags: string[] = [];
  const lookalike = detectLookalikeDomain(hostname);
  if (lookalike.isLookalike) {
    phishingFlags.push(`Lookalike Domain: ${lookalike.impersonatedBrand}`);
  }

  if (hasPasswordInput) {
    phishingFlags.push("Credential input field (type=password) detected");
  }

  if (hasLoginForm && lookalike.isLookalike) {
    phishingFlags.push("High-threat: Password harvesting form on deceptive lookalike brand domain");
  }

  if (/(urgent|account suspended|verify your identity|security alert|action required)/i.test(responseText)) {
    phishingFlags.push("Social engineering urgency language found in page text");
  }

  // Calculate Risk Score
  let risk = 10;
  if (!tlsInfo.isTrusted) risk += 15;
  if (lookalike.isLookalike) risk += 35;
  if (hasPasswordInput) risk += 20;
  if (hasLoginForm && lookalike.isLookalike) risk += 25;
  if (!hasHsts) risk += 5;
  if (!hasCsp) risk += 5;
  if (redirectChain.length > 2) risk += 10;

  const riskScore = Math.min(100, Math.max(0, risk));

  let verdict: RiskVerdict = "TRUSTED";
  if (riskScore >= 80) verdict = "MALICIOUS";
  else if (riskScore >= 65) verdict = "HIGH_RISK";
  else if (riskScore >= 40) verdict = "SUSPICIOUS";
  else if (riskScore >= 20) verdict = "LOW_RISK";

  const explanation =
    verdict === "MALICIOUS" || verdict === "HIGH_RISK"
      ? `Website analysis identified critical credential harvesting signals. ${phishingFlags.join("; ")}. Remember: HTTPS confirms encryption, but does not prove the website is legitimate.`
      : `Website presents a ${verdict.toLowerCase().replace("_", " ")} profile. Security headers: ${hasHsts ? "HSTS present" : "Missing HSTS"}, ${hasCsp ? "CSP active" : "Missing CSP"}.`;

  return {
    targetUrl: rawUrl,
    effectiveUrl,
    httpStatus,
    redirectChain,
    tls: tlsInfo,
    securityHeaders: {
      hasHsts,
      hasCsp,
      hasXFrameOptions,
      hasContentTypeOptions,
    },
    contentAnalysis: {
      pageTitle,
      hasLoginForm,
      hasPasswordInput,
      brandDetected: lookalike.impersonatedBrand,
      phishingFlags,
    },
    verdict,
    riskScore,
    confidence: 90,
    explanation,
  };
}
