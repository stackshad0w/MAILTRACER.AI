import dns from "node:dns/promises";

/**
 * Validates whether an IP address is a private, loopback, or reserved address
 * that should be blocked under SSRF prevention policies.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 Loopback (127.0.0.0/8)
  if (/^127\./.test(ip)) return true;

  // Zero network (0.0.0.0/8)
  if (/^0\./.test(ip)) return true;

  // Private RFC1918: 10.0.0.0/8
  if (/^10\./.test(ip)) return true;

  // Private RFC1918: 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  // Private RFC1918: 192.168.0.0/16
  if (/^192\.168\./.test(ip)) return true;

  // Link-Local RFC3927 & Cloud Metadata: 169.254.0.0/16
  if (/^169\.254\./.test(ip)) return true;

  // Carrier Grade NAT: 100.64.0.0/10
  const match100 = ip.match(/^100\.(\d+)\./);
  if (match100) {
    const secondOctet = parseInt(match100[1], 10);
    if (secondOctet >= 64 && secondOctet <= 127) return true;
  }

  // IPv6 loopback and unspecified
  if (ip === "::1" || ip === "::" || ip === "0:0:0:0:0:0:0:1") return true;

  // IPv6 link-local (fe80::/10) & unique local (fc00::/7)
  if (/^fe[89ab]/i.test(ip) || /^fc/i.test(ip) || /^fd/i.test(ip)) return true;

  return false;
}

export interface SSRFValidationResult {
  isValid: boolean;
  hostname: string;
  resolvedIp?: string;
  error?: string;
}

/**
 * Validates a URL against strict SSRF constraints:
 * 1. Protocol must be http: or https:
 * 2. Hostname must not be localhost or internal domain suffix
 * 3. DNS resolution must resolve to public, non-reserved IP
 */
export async function validateSafeUrl(rawUrl: string): Promise<SSRFValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { isValid: false, hostname: "", error: "Malformed URL syntax" };
  }

  // Enforce http/https only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      isValid: false,
      hostname: parsed.hostname,
      error: `Protocol '${parsed.protocol}' rejected. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // Block localhost and standard internal domain suffixes
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".corp") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home")
  ) {
    return {
      isValid: false,
      hostname,
      error: `SSRF Blocked: Hostname '${hostname}' refers to local or internal infrastructure.`,
    };
  }

  // Check if hostname is directly an IP
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        isValid: false,
        hostname,
        resolvedIp: hostname,
        error: `SSRF Blocked: Direct IP address '${hostname}' is in a private or reserved range.`,
      };
    }
    return { isValid: true, hostname, resolvedIp: hostname };
  }

  // Resolve DNS to verify public destination
  try {
    const lookup = await dns.lookup(hostname);
    if (isPrivateOrReservedIp(lookup.address)) {
      return {
        isValid: false,
        hostname,
        resolvedIp: lookup.address,
        error: `SSRF Blocked: Host '${hostname}' resolved to private/reserved IP ${lookup.address}.`,
      };
    }
    return { isValid: true, hostname, resolvedIp: lookup.address };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DNS resolution failure";
    return {
      isValid: false,
      hostname,
      error: `DNS resolution failed for '${hostname}': ${message}`,
    };
  }
}
