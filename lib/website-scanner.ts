import tls from "node:tls";
import dns from "node:dns/promises";
import { validateSafeUrl } from "./ssrf-filter";
import { detectLookalikeDomain } from "./domain-intel";
import { getIpIntelligence, IpIntelligenceResult } from "./ip-intel";
import { RiskVerdict } from "./types";

export interface WebsiteScanResult {
  targetUrl: string;
  effectiveUrl: string;
  httpStatus?: number;
  latencyMs?: number;
  serverIp?: string;
  serverBanner?: string;
  ipIntelligence?: IpIntelligenceResult;
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
    formsCount?: number;
    linksCount?: number;
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
 * Safely scans an external public website with SSRF protection, TLS inspection, live server IP geolocation, and DOM security analysis
 */
export async function scanWebsite(inputUrl: string): Promise<WebsiteScanResult> {
  let rawUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }

  const ssrfCheck = await validateSafeUrl(rawUrl);
  if (!ssrfCheck.isValid) {
    throw new Error(ssrfCheck.error || "URL violates SSRF security boundary.");
  }

  const parsedUrl = new URL(rawUrl);
  const hostname = parsedUrl.hostname;
  const redirectChain: string[] = [rawUrl];

  // 1. Resolve Server IP and Live Geolocation Intelligence
  let serverIp: string | undefined = undefined;
  let ipGeo: IpIntelligenceResult | undefined = undefined;
  try {
    ipGeo = await getIpIntelligence(hostname);
    serverIp = ipGeo.ip;
  } catch {
    // Non-fatal if DNS resolution fails initially
  }

  // 2. Inspect TLS if HTTPS
  let tlsInfo = { isTrusted: false };
  if (parsedUrl.protocol === "https:") {
    tlsInfo = await inspectTlsCertificate(hostname, parsedUrl.port ? parseInt(parsedUrl.port) : 443);
  }

  // 3. Safe HTTP Fetch with timeout & latency measurement
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  let response: Response;
  let responseText = "";
  let httpStatus = 0;
  let effectiveUrl = rawUrl;
  let latencyMs = 0;
  const startTime = Date.now();

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
    latencyMs = Date.now() - startTime;
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
    latencyMs = Date.now() - startTime;
    // If external site unreachable, analyze domain statically
    const lookalike = detectLookalikeDomain(hostname);
    return {
      targetUrl: rawUrl,
      effectiveUrl: rawUrl,
      httpStatus: 0,
      latencyMs,
      serverIp,
      ipIntelligence: ipGeo,
      redirectChain,
      tls: tlsInfo,
      securityHeaders: { hasHsts: false, hasCsp: false, hasXFrameOptions: false, hasContentTypeOptions: false },
      contentAnalysis: {
        pageTitle: undefined,
        hasLoginForm: false,
        hasPasswordInput: false,
        brandDetected: lookalike.impersonatedBrand,
        phishingFlags: lookalike.isLookalike ? ["Lookalike Domain Stem"] : ["Host Unreachable / Connection Timeout"],
      },
      verdict: lookalike.isLookalike ? "HIGH_RISK" : "INCONCLUSIVE",
      riskScore: lookalike.isLookalike ? 75 : 45,
      confidence: 80,
      explanation: `Target host unreachable (${err instanceof Error ? err.message : "Connection timeout"}). Domain analysis: ${lookalike.reason || "No obvious brand impersonation detected."}`,
    };
  }

  // 4. Security Headers Evaluation
  const headers = response.headers;
  const hasHsts = headers.has("strict-transport-security");
  const hasCsp = headers.has("content-security-policy");
  const hasXFrameOptions = headers.has("x-frame-options");
  const hasContentTypeOptions = headers.has("x-content-type-options");
  const serverBanner = headers.get("server") || undefined;

  // 5. Content DOM Analysis
  const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

  const formsCount = (responseText.match(/<form/gi) || []).length;
  const linksCount = (responseText.match(/<a\s+(?:[^>]*?\s+)?href=/gi) || []).length;

  const hasPasswordInput = /<input[^>]+type=["']password["']/i.test(responseText);
  const hasLoginForm =
    hasPasswordInput ||
    (/<form/i.test(responseText) && /(login|signin|log-in|sign-in|authenticate|passphrase|secret)/i.test(responseText));

  const phishingFlags: string[] = [];
  const lookalike = detectLookalikeDomain(hostname);
  if (lookalike.isLookalike) {
    phishingFlags.push(`Deceptive Brand Lookalike: Impersonates ${lookalike.impersonatedBrand}`);
  }

  if (hasPasswordInput) {
    phishingFlags.push("Credential input field (type=password) detected on page");
  }

  if (hasLoginForm && lookalike.isLookalike) {
    phishingFlags.push("Critical Hazard: Password harvest form on deceptive lookalike brand domain");
  }

  if (/(urgent|account suspended|verify your identity|security alert|action required|suspended immediately)/i.test(responseText)) {
    phishingFlags.push("Social engineering urgency language identified in page body");
  }

  // Calculate Risk Score
  let risk = 8;
  if (!tlsInfo.isTrusted) risk += 18;
  if (lookalike.isLookalike) risk += 38;
  if (hasPasswordInput) risk += 20;
  if (hasLoginForm && lookalike.isLookalike) risk += 28;
  if (!hasHsts) risk += 5;
  if (!hasCsp) risk += 5;
  if (redirectChain.length > 2) risk += 10;
  if (ipGeo?.isHosting && lookalike.isLookalike) risk += 15;

  const riskScore = Math.min(100, Math.max(0, risk));

  let verdict: RiskVerdict = "TRUSTED";
  if (riskScore >= 80) verdict = "MALICIOUS";
  else if (riskScore >= 65) verdict = "HIGH_RISK";
  else if (riskScore >= 40) verdict = "SUSPICIOUS";
  else if (riskScore >= 20) verdict = "LOW_RISK";

  const explanation =
    verdict === "MALICIOUS" || verdict === "HIGH_RISK"
      ? `Website analysis identified critical credential harvesting signals. ${phishingFlags.join("; ")}. Remember: HTTPS confirms encryption, but does not prove the website is authentic.`
      : `Website presents a ${verdict.toLowerCase().replace("_", " ")} profile. Security headers: ${hasHsts ? "HSTS active" : "Missing HSTS"}, ${hasCsp ? "CSP active" : "Missing CSP"}. Server latency: ${latencyMs}ms.`;

  return {
    targetUrl: rawUrl,
    effectiveUrl,
    httpStatus,
    latencyMs,
    serverIp,
    serverBanner,
    ipIntelligence: ipGeo,
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
      formsCount,
      linksCount,
    },
    verdict,
    riskScore,
    confidence: 90,
    explanation,
  };
}

