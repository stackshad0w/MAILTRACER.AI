import demoData from "./seed-data.json";

export interface SyntheticDemoCase {
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  isDemo: boolean;
  tags: string[];
  verdict: "TRUSTED" | "LOW_RISK" | "SUSPICIOUS" | "HIGH_RISK" | "MALICIOUS" | "INCONCLUSIVE";
  threatScore: number;
  confidence: number;
  threatDna: string;
  campaign?: string | null;
  email: {
    subject: string;
    fromAddress: string;
    fromName?: string;
    toAddress: string;
    replyTo?: string;
    returnPath?: string;
    bodyText: string;
    authResults: {
      spf: { status: string; domain: string; aligned: boolean; details: string };
      dkim: { status: string; domain?: string | null; aligned: boolean; details: string };
      dmarc: { status: string; domain: string; aligned: boolean; details: string };
    };
    urls: { url: string; domain: string; isLookalike: boolean; hasCredForm: boolean; reputation: string }[];
    attachments: { filename: string; contentType: string; sizeBytes: number; sha256: string; md5: string; sha1: string; isMalicious: boolean; malwareType?: string }[];
    ip?: string;
    asn?: string;
    country?: string;
    reasons: { reason: string; points: number; category: string }[];
  };
}

export const SYNTHETIC_DEMO_CASES = demoData as unknown as SyntheticDemoCase[];
