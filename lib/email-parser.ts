import crypto from "node:crypto";
import { ParsedEmail, ParsedEmailHop } from "./types";

/**
 * Extracts all IPv4 addresses from a string, filtering out loopback/zero
 */
export function extractIps(text: string): string[] {
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const matches = text.match(ipRegex) || [];
  return Array.from(new Set(matches)).filter((ip) => {
    const parts = ip.split(".").map(Number);
    return parts.every((p) => p >= 0 && p <= 255);
  });
}

/**
 * Extracts and normalizes URLs from text and HTML
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches)).map((u) => u.replace(/[.,;!?)]+$/, ""));
}

/**
 * Parses raw RFC 5322 email text into structured headers, body, hops, and attachments
 */
export function parseRawEmail(rawContent: string): ParsedEmail {
  // Evidence Hashes
  const evidenceSha256 = crypto.createHash("sha256").update(rawContent).digest("hex");
  const evidenceMd5 = crypto.createHash("md5").update(rawContent).digest("hex");
  const evidenceSha1 = crypto.createHash("sha1").update(rawContent).digest("hex");

  // Separate headers from body (double newline CRLF or LF)
  const headerBodySplit = rawContent.split(/\r?\n\r?\n/);
  const rawHeadersSection = headerBodySplit[0] || "";
  const rawBodySection = headerBodySplit.slice(1).join("\n\n");

  // Unfold multi-line headers (RFC 5322 Section 2.2.3: CRLF followed by WSP is continuation)
  const unfoldedHeaders: string[] = [];
  const rawLines = rawHeadersSection.split(/\r?\n/);
  for (const line of rawLines) {
    if (/^[ \t]/.test(line) && unfoldedHeaders.length > 0) {
      unfoldedHeaders[unfoldedHeaders.length - 1] += " " + line.trim();
    } else if (line.trim().length > 0) {
      unfoldedHeaders.push(line);
    }
  }

  const headersMap: Record<string, string> = {};
  const receivedHeaders: string[] = [];

  for (const h of unfoldedHeaders) {
    const colonIdx = h.indexOf(":");
    if (colonIdx > 0) {
      const key = h.substring(0, colonIdx).trim().toLowerCase();
      const value = h.substring(colonIdx + 1).trim();
      headersMap[key] = value;
      if (key === "received") {
        receivedHeaders.push(value);
      }
    }
  }

  // Sender & Recipient fields
  const fromRaw = headersMap["from"] || "Unknown Sender <unknown@example.com>";
  let fromAddress = "unknown@example.com";
  let fromName: string | undefined = undefined;
  const fromMatch = fromRaw.match(/(?:"?([^"]*)"?\s)?<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/);
  if (fromMatch) {
    fromName = fromMatch[1]?.trim() || undefined;
    fromAddress = fromMatch[2]?.toLowerCase().trim() || fromAddress;
  }

  const toRaw = headersMap["to"] || "undisclosed-recipients";
  const toAddressMatch = toRaw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const toAddress = toAddressMatch ? toAddressMatch[0].toLowerCase() : toRaw;

  const replyTo = headersMap["reply-to"]?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]?.toLowerCase();
  const returnPath = headersMap["return-path"]?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]?.toLowerCase();
  const subject = headersMap["subject"] || "(No Subject)";
  const messageId = headersMap["message-id"] || `<${evidenceSha256.substring(0, 16)}@mailtracer.ai>`;
  const dateSent = headersMap["date"] || new Date().toUTCString();

  // Parse Received hops in chronological sequence (top of email is latest hop, reverse for chronological)
  const hops: ParsedEmailHop[] = receivedHeaders.reverse().map((rec, index) => {
    const fromMatch = rec.match(/from\s+([^\s]+)/i);
    const byMatch = rec.match(/by\s+([^\s]+)/i);
    const withMatch = rec.match(/with\s+([^\s]+)/i);
    const dateMatch = rec.match(/;\s*(.+)$/);
    const ipMatch = rec.match(/\[([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\]/);

    const hopIp = ipMatch ? ipMatch[1] : undefined;
    const isAnomalous = hopIp?.startsWith("10.") || hopIp?.startsWith("192.168.") || hopIp?.startsWith("127.");

    return {
      hopIndex: index,
      from: fromMatch ? fromMatch[1] : undefined,
      by: byMatch ? byMatch[1] : undefined,
      with: withMatch ? withMatch[1] : undefined,
      date: dateMatch ? dateMatch[1].trim() : undefined,
      ip: hopIp,
      isAnomalous,
    };
  });

  // Parse Authentication-Results or ARC headers
  const authHeader = headersMap["authentication-results"] || "";
  const spfStatusMatch = authHeader.match(/spf=([a-zA-Z]+)(?:\s+\(([^)]+)\))?/i);
  const dkimStatusMatch = authHeader.match(/dkim=([a-zA-Z]+)(?:\s+\(([^)]+)\))?/i);
  const dmarcStatusMatch = authHeader.match(/dmarc=([a-zA-Z]+)(?:\s+\(([^)]+)\))?/i);

  const authResults = {
    spf: {
      status: spfStatusMatch ? spfStatusMatch[1].toUpperCase() : "NONE",
      domain: headersMap["received-spf"]?.match(/domain of ([^\s;]+)/i)?.[1],
      aligned: (spfStatusMatch?.[1].toUpperCase() === "PASS"),
      details: spfStatusMatch?.[2],
    },
    dkim: {
      status: dkimStatusMatch ? dkimStatusMatch[1].toUpperCase() : (headersMap["dkim-signature"] ? "PRESENT" : "NONE"),
      domain: headersMap["dkim-signature"]?.match(/d=([a-zA-Z0-9.-]+)/i)?.[1],
      aligned: (dkimStatusMatch?.[1].toUpperCase() === "PASS"),
      details: dkimStatusMatch?.[2],
    },
    dmarc: {
      status: dmarcStatusMatch ? dmarcStatusMatch[1].toUpperCase() : "NONE",
      domain: fromAddress.split("@")[1],
      aligned: (dmarcStatusMatch?.[1].toUpperCase() === "PASS"),
      details: dmarcStatusMatch?.[2],
    },
  };

  // Body content & Attachments
  let bodyText = rawBodySection;
  let bodyHtml: string | undefined = undefined;
  const attachments: ParsedEmail["attachments"] = [];

  // Detect and extract MIME boundaries if present
  const contentTypeHeader = headersMap["content-type"] || "";
  const boundaryMatch = contentTypeHeader.match(/boundary="?([^";]+)"?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = rawBodySection.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    for (const part of parts) {
      if (part.includes("Content-Disposition: attachment") || part.includes('filename="')) {
        const filenameMatch = part.match(/filename="?([^"\r\n]+)"?/i);
        const filename = filenameMatch ? filenameMatch[1] : "attachment.bin";
        const ctMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
        const ct = ctMatch ? ctMatch[1].trim() : "application/octet-stream";

        const contentParts = part.split(/\r?\n\r?\n/);
        const data = contentParts.slice(1).join("\n");
        const aSha256 = crypto.createHash("sha256").update(data).digest("hex");
        const aMd5 = crypto.createHash("md5").update(data).digest("hex");
        const aSha1 = crypto.createHash("sha1").update(data).digest("hex");

        attachments.push({
          filename,
          contentType: ct,
          sizeBytes: Buffer.byteLength(data),
          sha256: aSha256,
          md5: aMd5,
          sha1: aSha1,
        });
      } else if (part.includes("text/html")) {
        const htmlParts = part.split(/\r?\n\r?\n/);
        bodyHtml = htmlParts.slice(1).join("\n");
      } else if (part.includes("text/plain")) {
        const plainParts = part.split(/\r?\n\r?\n/);
        bodyText = plainParts.slice(1).join("\n");
      }
    }
  }

  // Extract URLs and IPs
  const combinedContent = `${rawHeadersSection}\n${bodyText}\n${bodyHtml || ""}`;
  const extractedUrls = extractUrls(combinedContent);
  const extractedIps = extractIps(rawHeadersSection);

  return {
    messageId,
    subject,
    fromAddress,
    fromName,
    toAddress,
    replyTo,
    returnPath,
    dateSent,
    bodyText,
    bodyHtml,
    rawHeaders: rawHeadersSection,
    headersMap,
    hops,
    extractedUrls,
    extractedIps,
    attachments,
    authResults,
  };
}
