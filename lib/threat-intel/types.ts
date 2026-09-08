export interface IntelLookupResult {
  provider: string;
  indicator: string;
  indicatorType: "IP" | "DOMAIN" | "URL" | "HASH";
  status: "AVAILABLE" | "NOT_CONFIGURED" | "RATE_LIMITED" | "ERROR";
  verdict: "BENIGN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN";
  positives?: number;
  totalEngines?: number;
  score?: number;
  threatName?: string;
  details?: Record<string, unknown>;
  cachedUntil?: Date;
}

export interface ThreatIntelProvider {
  name: string;
  isConfigured(): boolean;
  lookupIP(ip: string): Promise<IntelLookupResult>;
  lookupDomain(domain: string): Promise<IntelLookupResult>;
  lookupURL(url: string): Promise<IntelLookupResult>;
  lookupHash(hash: string): Promise<IntelLookupResult>;
}
