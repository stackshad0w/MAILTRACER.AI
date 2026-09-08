import { IntelLookupResult, ThreatIntelProvider } from "./types";

// In-Memory Cache with TTL
const cache = new Map<string, { result: IntelLookupResult; expires: number }>();

class VirusTotalProvider implements ThreatIntelProvider {
  name = "VirusTotal";
  private apiKey = process.env.VIRUSTOTAL_API_KEY || "";

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async lookupIP(ip: string): Promise<IntelLookupResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        indicator: ip,
        indicatorType: "IP",
        status: "NOT_CONFIGURED",
        verdict: "UNKNOWN",
        details: { note: "Configure VIRUSTOTAL_API_KEY in .env to query live VirusTotal IP telemetry" },
      };
    }
    try {
      const res = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
        headers: { "x-apikey": this.apiKey },
      });
      if (res.status === 429) {
        return { provider: this.name, indicator: ip, indicatorType: "IP", status: "RATE_LIMITED", verdict: "UNKNOWN" };
      }
      const data = await res.json();
      const stats = data.data?.attributes?.last_analysis_stats || {};
      const malicious = stats.malicious || 0;
      const total = Object.values(stats).reduce((a: number, b: unknown) => a + Number(b), 0) || 1;
      return {
        provider: this.name,
        indicator: ip,
        indicatorType: "IP",
        status: "AVAILABLE",
        verdict: malicious > 3 ? "MALICIOUS" : malicious > 0 ? "SUSPICIOUS" : "BENIGN",
        positives: malicious,
        totalEngines: total,
        score: Math.round((malicious / total) * 100),
      };
    } catch {
      return { provider: this.name, indicator: ip, indicatorType: "IP", status: "ERROR", verdict: "UNKNOWN" };
    }
  }

  async lookupDomain(domain: string): Promise<IntelLookupResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        indicator: domain,
        indicatorType: "DOMAIN",
        status: "NOT_CONFIGURED",
        verdict: "UNKNOWN",
        details: { note: "Configure VIRUSTOTAL_API_KEY in .env to query live VirusTotal domain telemetry" },
      };
    }
    try {
      const res = await fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
        headers: { "x-apikey": this.apiKey },
      });
      const data = await res.json();
      const stats = data.data?.attributes?.last_analysis_stats || {};
      const malicious = stats.malicious || 0;
      const total = Object.values(stats).reduce((a: number, b: unknown) => a + Number(b), 0) || 1;
      return {
        provider: this.name,
        indicator: domain,
        indicatorType: "DOMAIN",
        status: "AVAILABLE",
        verdict: malicious > 3 ? "MALICIOUS" : malicious > 0 ? "SUSPICIOUS" : "BENIGN",
        positives: malicious,
        totalEngines: total,
      };
    } catch {
      return { provider: this.name, indicator: domain, indicatorType: "DOMAIN", status: "ERROR", verdict: "UNKNOWN" };
    }
  }

  async lookupURL(url: string): Promise<IntelLookupResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        indicator: url,
        indicatorType: "URL",
        status: "NOT_CONFIGURED",
        verdict: "UNKNOWN",
        details: { note: "Configure VIRUSTOTAL_API_KEY in .env to query live VirusTotal URL intelligence" },
      };
    }
    return { provider: this.name, indicator: url, indicatorType: "URL", status: "NOT_CONFIGURED", verdict: "UNKNOWN" };
  }

  async lookupHash(hash: string): Promise<IntelLookupResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        indicator: hash,
        indicatorType: "HASH",
        status: "NOT_CONFIGURED",
        verdict: "UNKNOWN",
        details: { note: "Configure VIRUSTOTAL_API_KEY in .env to query live file hash intelligence" },
      };
    }
    try {
      const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
        headers: { "x-apikey": this.apiKey },
      });
      const data = await res.json();
      const stats = data.data?.attributes?.last_analysis_stats || {};
      const malicious = stats.malicious || 0;
      const total = Object.values(stats).reduce((a: number, b: unknown) => a + Number(b), 0) || 1;
      return {
        provider: this.name,
        indicator: hash,
        indicatorType: "HASH",
        status: "AVAILABLE",
        verdict: malicious > 3 ? "MALICIOUS" : malicious > 0 ? "SUSPICIOUS" : "BENIGN",
        positives: malicious,
        totalEngines: total,
        threatName: data.data?.attributes?.meaningful_name,
      };
    } catch {
      return { provider: this.name, indicator: hash, indicatorType: "HASH", status: "ERROR", verdict: "UNKNOWN" };
    }
  }
}

class AbuseIPDBProvider implements ThreatIntelProvider {
  name = "AbuseIPDB";
  private apiKey = process.env.ABUSEIPDB_API_KEY || "";

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async lookupIP(ip: string): Promise<IntelLookupResult> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        indicator: ip,
        indicatorType: "IP",
        status: "NOT_CONFIGURED",
        verdict: "UNKNOWN",
        details: { note: "Configure ABUSEIPDB_API_KEY in .env to query live IP abuse reports" },
      };
    }
    try {
      const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
        headers: { Key: this.apiKey, Accept: "application/json" },
      });
      const data = await res.json();
      const confidence = data.data?.abuseConfidenceScore || 0;
      return {
        provider: this.name,
        indicator: ip,
        indicatorType: "IP",
        status: "AVAILABLE",
        verdict: confidence > 50 ? "MALICIOUS" : confidence > 20 ? "SUSPICIOUS" : "BENIGN",
        score: confidence,
        details: { totalReports: data.data?.totalReports, isp: data.data?.isp },
      };
    } catch {
      return { provider: this.name, indicator: ip, indicatorType: "IP", status: "ERROR", verdict: "UNKNOWN" };
    }
  }

  async lookupDomain(domain: string): Promise<IntelLookupResult> {
    return { provider: this.name, indicator: domain, indicatorType: "DOMAIN", status: "NOT_CONFIGURED", verdict: "UNKNOWN" };
  }
  async lookupURL(url: string): Promise<IntelLookupResult> {
    return { provider: this.name, indicator: url, indicatorType: "URL", status: "NOT_CONFIGURED", verdict: "UNKNOWN" };
  }
  async lookupHash(hash: string): Promise<IntelLookupResult> {
    return { provider: this.name, indicator: hash, indicatorType: "HASH", status: "NOT_CONFIGURED", verdict: "UNKNOWN" };
  }
}

export class ThreatIntelManager {
  private providers: ThreatIntelProvider[] = [new VirusTotalProvider(), new AbuseIPDBProvider()];

  async queryIndicator(
    type: "IP" | "DOMAIN" | "URL" | "HASH",
    value: string
  ): Promise<IntelLookupResult[]> {
    const cacheKey = `${type}:${value}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return [cached.result];
    }

    const promises = this.providers.map(async (p) => {
      switch (type) {
        case "IP":
          return p.lookupIP(value);
        case "DOMAIN":
          return p.lookupDomain(value);
        case "URL":
          return p.lookupURL(value);
        case "HASH":
          return p.lookupHash(value);
      }
    });

    const results = await Promise.all(promises);

    // Cache first positive result or first available result for 15 minutes
    const available = results.find((r) => r.status === "AVAILABLE");
    if (available) {
      cache.set(cacheKey, { result: available, expires: Date.now() + 15 * 60 * 1000 });
    }

    return results;
  }
}

export const threatIntel = new ThreatIntelManager();
