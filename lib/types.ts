export type RiskVerdict =
  | "TRUSTED"
  | "LOW_RISK"
  | "SUSPICIOUS"
  | "HIGH_RISK"
  | "MALICIOUS"
  | "INCONCLUSIVE";

export type ThreatCategory =
  | "BENIGN"
  | "SPAM"
  | "PHISHING"
  | "SPEAR_PHISHING"
  | "BEC"
  | "CREDENTIAL_THEFT"
  | "FINANCIAL_FRAUD"
  | "MALWARE_DELIVERY"
  | "IMPERSONATION"
  | "SOCIAL_ENGINEERING"
  | "UNKNOWN";

export interface ScoreReason {
  reason: string;
  points: number;
  category: "AUTH" | "DOMAIN" | "URL" | "CONTENT" | "INFRA" | "INTEL" | "ATTACHMENT";
}

export interface VerificationMatrixRow {
  signal: string;
  result: string;
  source: string;
  confidence: "High" | "Medium" | "Low";
  status: "pass" | "warn" | "fail" | "neutral";
}

export interface ParsedEmailHop {
  hopIndex: number;
  from?: string;
  by?: string;
  with?: string;
  date?: string;
  ip?: string;
  isAnomalous?: boolean;
}

export interface ParsedEmail {
  messageId?: string;
  subject: string;
  fromAddress: string;
  fromName?: string;
  toAddress: string;
  replyTo?: string;
  returnPath?: string;
  dateSent?: string;
  bodyText: string;
  bodyHtml?: string;
  rawHeaders: string;
  headersMap: Record<string, string>;
  hops: ParsedEmailHop[];
  extractedUrls: string[];
  extractedIps: string[];
  attachments: {
    filename: string;
    contentType: string;
    sizeBytes: number;
    sha256: string;
    md5: string;
    sha1: string;
  }[];
  authResults: {
    spf?: { status: string; domain?: string; aligned: boolean; details?: string };
    dkim?: { status: string; domain?: string; aligned: boolean; details?: string };
    dmarc?: { status: string; domain?: string; aligned: boolean; details?: string };
  };
}

export interface ThreatDNAResult {
  dnaCode: string;
  headerFingerprint: string;
  infraFingerprint: string;
  contentFingerprint: string;
  similarityScore?: number;
  matchedCampaign?: string;
}

export interface AttackGraphData {
  nodes: {
    id: string;
    label: string;
    type: "EMAIL" | "SENDER" | "DOMAIN" | "IP" | "ASN" | "COUNTRY" | "URL" | "ATTACHMENT" | "HASH" | "DNA" | "CAMPAIGN";
    threatLevel: "SAFE" | "INFO" | "WARNING" | "DANGER";
    details?: Record<string, unknown>;
  }[];
  edges: {
    source: string;
    target: string;
    label: string;
  }[];
}
