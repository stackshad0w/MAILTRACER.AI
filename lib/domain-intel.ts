import dns from "node:dns/promises";

const TOP_MONITORED_BRANDS = [
  { name: "Microsoft", domain: "microsoft.com", root: "microsoft" },
  { name: "Microsoft 365", domain: "office.com", root: "office" },
  { name: "Google", domain: "google.com", root: "google" },
  { name: "PayPal", domain: "paypal.com", root: "paypal" },
  { name: "Apple", domain: "apple.com", root: "apple" },
  { name: "Amazon", domain: "amazon.com", root: "amazon" },
  { name: "Netflix", domain: "netflix.com", root: "netflix" },
  { name: "Chase", domain: "chase.com", root: "chase" },
  { name: "Bank of America", domain: "bankofamerica.com", root: "bankofamerica" },
  { name: "DHL", domain: "dhl.com", root: "dhl" },
  { name: "FedEx", domain: "fedex.com", root: "fedex" },
];

/**
 * Calculates Levenshtein edit distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export interface LookalikeDetectionResult {
  isLookalike: boolean;
  impersonatedBrand?: string;
  matchedLegitimateDomain?: string;
  confidence: number;
  reason?: string;
}

/**
 * Detects if a domain is an impersonation, typosquat, or lookalike of a major brand
 */
export function detectLookalikeDomain(domain: string): LookalikeDetectionResult {
  const cleanDomain = domain.toLowerCase().trim();
  const domainParts = cleanDomain.split(".");
  const sld = domainParts.length > 1 ? domainParts[domainParts.length - 2] : cleanDomain;

  for (const brand of TOP_MONITORED_BRANDS) {
    if (cleanDomain === brand.domain || cleanDomain.endsWith(`.${brand.domain}`)) {
      return { isLookalike: false, confidence: 1.0 };
    }

    // Direct substring or affix attack: e.g. "microsoft-verify.com", "login-paypal.com", "paypa1.com"
    if (sld.includes(brand.root) && sld !== brand.root) {
      return {
        isLookalike: true,
        impersonatedBrand: brand.name,
        matchedLegitimateDomain: brand.domain,
        confidence: 0.95,
        reason: `Subdomain/stem contains targeted brand name '${brand.root}' with deceptive prefix/suffix.`,
      };
    }

    // Levenshtein & Homoglyph test
    const normalizedSld = sld
      .replace(/0/g, "o")
      .replace(/1/g, "l")
      .replace(/rn/g, "m")
      .replace(/vv/g, "w")
      .replace(/-/g, "");

    const dist = levenshtein(normalizedSld, brand.root);
    if (dist > 0 && dist <= 2 && Math.abs(normalizedSld.length - brand.root.length) <= 2) {
      return {
        isLookalike: true,
        impersonatedBrand: brand.name,
        matchedLegitimateDomain: brand.domain,
        confidence: 0.90,
        reason: `Domain stem '${sld}' has edit distance ${dist} from '${brand.root}' (Typosquatting/Homoglyph).`,
      };
    }
  }

  return { isLookalike: false, confidence: 0.85 };
}

export interface DomainDnsIntelligence {
  domain: string;
  aRecords: string[];
  mxRecords: string[];
  txtRecords: string[];
  nsRecords: string[];
  isResolving: boolean;
  lookalike: LookalikeDetectionResult;
}

/**
 * Performs full DNS interrogation for a domain
 */
export async function getDomainDnsIntelligence(domain: string): Promise<DomainDnsIntelligence> {
  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const lookalike = detectLookalikeDomain(cleanDomain);

  let aRecords: string[] = [];
  let mxRecords: string[] = [];
  let txtRecords: string[] = [];
  let nsRecords: string[] = [];
  let isResolving = false;

  try {
    const a = await dns.resolve4(cleanDomain).catch(() => []);
    aRecords = a;
    if (a.length > 0) isResolving = true;
  } catch {}

  try {
    const mx = await dns.resolveMx(cleanDomain).catch(() => []);
    mxRecords = mx.map((m) => `${m.priority} ${m.exchange}`);
  } catch {}

  try {
    const txt = await dns.resolveTxt(cleanDomain).catch(() => []);
    txtRecords = txt.flat();
  } catch {}

  try {
    const ns = await dns.resolveNs(cleanDomain).catch(() => []);
    nsRecords = ns;
  } catch {}

  return {
    domain: cleanDomain,
    aRecords,
    mxRecords,
    txtRecords,
    nsRecords,
    isResolving,
    lookalike,
  };
}
