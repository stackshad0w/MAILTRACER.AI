import { RiskVerdict, ScoreReason } from "./types";

export interface ThreatEvaluationInput {
  dmarcStatus?: string; // PASS, FAIL, NONE
  spfStatus?: string;   // PASS, FAIL, SOFTFAIL, NEUTRAL, NONE
  dkimStatus?: string;  // PASS, FAIL, NONE
  senderReplyToMismatch?: boolean;
  domainAgeDays?: number;
  isNewlyRegisteredDomain?: boolean;
  isLookalikeDomain?: boolean;
  hasMaliciousUrl?: boolean;
  hasSuspiciousUrl?: boolean;
  hasCredentialForm?: boolean;
  hasDangerousAttachment?: boolean;
  knownMalwareHash?: boolean;
  aiClassification?: string; // PHISHING, BEC, MALWARE_DELIVERY, BENIGN, etc.
  aiUrgencyLevel?: string;
  hasSuspiciousIpReputation?: boolean;
  relatedCampaignDetected?: boolean;
}

export interface ThreatEvaluationResult {
  score: number;
  verdict: RiskVerdict;
  confidence: number;
  reasons: ScoreReason[];
  recommendedActions: string[];
}

export function evaluateThreatScore(input: ThreatEvaluationInput): ThreatEvaluationResult {
  let score = 0;
  const reasons: ScoreReason[] = [];
  let evaluatedSignalsCount = 0;

  // 1. DMARC / SPF / DKIM Authentication
  if (input.dmarcStatus === "FAIL") {
    score += 20;
    reasons.push({ reason: "DMARC authentication failed or rejected", points: 20, category: "AUTH" });
    evaluatedSignalsCount++;
  } else if (input.dmarcStatus === "PASS") {
    score = Math.max(0, score - 10);
    reasons.push({ reason: "DMARC authentication passed and aligned", points: -10, category: "AUTH" });
    evaluatedSignalsCount++;
  }

  if (input.spfStatus === "FAIL" || input.spfStatus === "SOFTFAIL") {
    score += 15;
    reasons.push({ reason: `SPF validation ${input.spfStatus.toLowerCase()}`, points: 15, category: "AUTH" });
    evaluatedSignalsCount++;
  } else if (input.spfStatus === "PASS") {
    evaluatedSignalsCount++;
  }

  if (input.dkimStatus === "FAIL") {
    score += 15;
    reasons.push({ reason: "DKIM signature validation failed", points: 15, category: "AUTH" });
    evaluatedSignalsCount++;
  } else if (input.dkimStatus === "PASS") {
    evaluatedSignalsCount++;
  }

  // 2. Sender / Identity integrity
  if (input.senderReplyToMismatch) {
    score += 15;
    reasons.push({ reason: "Sender display domain differs from Reply-To destination", points: 15, category: "AUTH" });
    evaluatedSignalsCount++;
  }

  // 3. Domain Intelligence
  if (input.isLookalikeDomain) {
    score += 20;
    reasons.push({ reason: "Lookalike / typosquatted brand domain detected", points: 20, category: "DOMAIN" });
    evaluatedSignalsCount++;
  }

  if (input.isNewlyRegisteredDomain || (input.domainAgeDays !== undefined && input.domainAgeDays < 30)) {
    score += 15;
    reasons.push({
      reason: `Newly registered domain (${input.domainAgeDays ?? "<30"} days old)`,
      points: 15,
      category: "DOMAIN",
    });
    evaluatedSignalsCount++;
  }

  // 4. URL & Website Verification
  if (input.hasMaliciousUrl) {
    score += 25;
    reasons.push({ reason: "Embedded URL flagged as malicious in threat intelligence", points: 25, category: "URL" });
    evaluatedSignalsCount++;
  } else if (input.hasSuspiciousUrl) {
    score += 15;
    reasons.push({ reason: "Suspicious or heavily obfuscated URL embedded", points: 15, category: "URL" });
    evaluatedSignalsCount++;
  }

  if (input.hasCredentialForm) {
    score += 20;
    reasons.push({ reason: "Target website hosts suspicious credential harvesting form", points: 20, category: "URL" });
    evaluatedSignalsCount++;
  }

  // 5. Attachment & File Hash
  if (input.knownMalwareHash) {
    score += 35;
    reasons.push({ reason: "Attachment SHA256 matches known malicious malware signature", points: 35, category: "ATTACHMENT" });
    evaluatedSignalsCount++;
  } else if (input.hasDangerousAttachment) {
    score += 20;
    reasons.push({ reason: "Dangerous executable or weaponizable attachment payload", points: 20, category: "ATTACHMENT" });
    evaluatedSignalsCount++;
  }

  // 6. Network & Infrastructure
  if (input.hasSuspiciousIpReputation) {
    score += 10;
    reasons.push({ reason: "Hosting IP has recorded abuse reports or bulletproof hosting profile", points: 10, category: "INFRA" });
    evaluatedSignalsCount++;
  }

  if (input.relatedCampaignDetected) {
    score += 15;
    reasons.push({ reason: "Correlated with active ongoing cyber attack campaign cluster", points: 15, category: "INTEL" });
    evaluatedSignalsCount++;
  }

  // 7. Content / AI Intent
  if (input.aiClassification === "PHISHING" || input.aiClassification === "CREDENTIAL_THEFT") {
    score += 15;
    reasons.push({ reason: "AI content analysis detected credential harvesting / phishing cues", points: 15, category: "CONTENT" });
    evaluatedSignalsCount++;
  } else if (input.aiClassification === "BEC" || input.aiClassification === "FINANCIAL_FRAUD") {
    score += 20;
    reasons.push({ reason: "AI analysis flagged Business Email Compromise / wire fraud intent", points: 20, category: "CONTENT" });
    evaluatedSignalsCount++;
  } else if (input.aiClassification === "MALWARE_DELIVERY") {
    score += 25;
    reasons.push({ reason: "AI analysis flagged social engineering lure for malware payload", points: 25, category: "CONTENT" });
    evaluatedSignalsCount++;
  } else if (input.aiClassification) {
    evaluatedSignalsCount++;
  }

  // Clamp score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine Verdict
  let verdict: RiskVerdict;
  if (evaluatedSignalsCount < 2) {
    verdict = "INCONCLUSIVE";
  } else if (normalizedScore >= 85) {
    verdict = "MALICIOUS";
  } else if (normalizedScore >= 70) {
    verdict = "HIGH_RISK";
  } else if (normalizedScore >= 40) {
    verdict = "SUSPICIOUS";
  } else if (normalizedScore >= 20) {
    verdict = "LOW_RISK";
  } else {
    verdict = "TRUSTED";
  }

  // Compute Confidence based on number and agreement of signals
  const baseConfidence = Math.min(98, 60 + evaluatedSignalsCount * 5);
  const confidence = evaluatedSignalsCount < 2 ? 40 : baseConfidence;

  // Formulate Actionable Recommendations based on Section 57
  const recommendedActions: string[] = [];
  if (verdict === "MALICIOUS" || verdict === "HIGH_RISK") {
    recommendedActions.push("Do not interact with the message or click any embedded links.");
    recommendedActions.push("Quarantine message from mailbox and purge from mail gateway.");
    recommendedActions.push("Add sender domain and embedded URLs to organizational DNS firewall blocklist.");
    recommendedActions.push("Search enterprise mail logs for other recipients of similar Threat DNA.");
  } else if (verdict === "SUSPICIOUS") {
    recommendedActions.push("Do not click links or download attachments until verified.");
    recommendedActions.push("Verify sender identity through a secondary, out-of-band communication channel.");
    recommendedActions.push("Inspect the embedded domain registration and TLS certificate before visiting.");
  } else if (verdict === "LOW_RISK") {
    recommendedActions.push("Exercise normal caution; subtle signals warrant analyst manual review.");
    recommendedActions.push("Verify unsolicited request details before responding.");
  } else if (verdict === "TRUSTED") {
    recommendedActions.push("No immediate defensive action required.");
    recommendedActions.push("Authentication checks passed and sender reputation is positive.");
  } else {
    recommendedActions.push("Collect additional header or infrastructure data to establish confidence.");
  }

  return {
    score: normalizedScore,
    verdict,
    confidence,
    reasons,
    recommendedActions,
  };
}
