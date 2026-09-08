import { ThreatCategory } from "../types";

export interface AIAnalysisResult {
  classification: ThreatCategory;
  confidence: number;
  intent: string;
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  indicators: { type: string; evidence: string }[];
  explanation: string;
  recommendedActions: string[];
  modelUsed: string;
  isFallback: boolean;
}

/**
 * Deterministic rule-based heuristic classifier used when AI API keys are not provided.
 * Transparently flagged as isFallback: true per specification section 50.
 */
export function analyzeEmailWithRules(
  subject: string,
  bodyText: string,
  fromAddress: string,
  replyTo?: string,
  hasSuspiciousUrl?: boolean
): AIAnalysisResult {
  const text = `${subject} ${bodyText}`.toLowerCase();
  const indicators: { type: string; evidence: string }[] = [];
  let urgencyLevel: AIAnalysisResult["urgencyLevel"] = "LOW";

  // Check Urgency cues
  if (/(immediate action|urgent|within 24 hours|account suspended|final warning|immediately)/i.test(text)) {
    urgencyLevel = "HIGH";
    indicators.push({
      type: "urgency_coercion",
      evidence: "Email imposes acute artificial deadline ('immediate action' / 'within 24 hours') to bypass scrutiny.",
    });
  }

  // Check Credential Harvesting
  if (/(password|sign in|login to your account|verify your account|update your credentials|reset password)/i.test(text)) {
    indicators.push({
      type: "credential_request",
      evidence: "Language directly prompts recipient to input credentials or access account portal.",
    });
  }

  // Check Financial / Wire Fraud / BEC
  if (/(wire transfer|invoice attached|direct deposit|bank details|w-2|ach payment|swift code|gift card)/i.test(text)) {
    indicators.push({
      type: "financial_solicitation",
      evidence: "Email requests urgent financial action, bank account update, or unverified wire transfer.",
    });
  }

  // Check Authority / Impersonation
  if (/(ceo|president|cfo|it support|helpdesk|system administrator|payroll)/i.test(text)) {
    indicators.push({
      type: "authority_impersonation",
      evidence: "Sender attempts to leverage corporate executive or IT administrative authority.",
    });
  }

  // Check Reply-To mismatch
  if (replyTo && fromAddress) {
    const fromDomain = fromAddress.split("@")[1];
    const replyDomain = replyTo.split("@")[1];
    if (fromDomain && replyDomain && fromDomain !== replyDomain) {
      indicators.push({
        type: "reply_to_mismatch",
        evidence: `Sender address domain '${fromDomain}' diverts responses to '${replyDomain}'.`,
      });
    }
  }

  // Classification Logic
  let classification: ThreatCategory = "BENIGN";
  let confidence = 0.85;
  let intent = "Routine or benign business communication.";

  if (indicators.some((i) => i.type === "credential_request") && (hasSuspiciousUrl || indicators.some((i) => i.type === "urgency_coercion"))) {
    classification = "PHISHING";
    confidence = 0.94;
    intent = "Credential harvesting phishing attack targeting user account authentication.";
  } else if (indicators.some((i) => i.type === "financial_solicitation") && indicators.some((i) => i.type === "authority_impersonation")) {
    classification = "BEC";
    confidence = 0.91;
    intent = "Business Email Compromise (BEC) / CEO fraud attempting unauthorized fund redirection.";
  } else if (indicators.some((i) => i.type === "urgency_coercion") && indicators.some((i) => i.type === "financial_solicitation")) {
    classification = "FINANCIAL_FRAUD";
    confidence = 0.89;
    intent = "Financial scam pressuring recipient to authorize fraudulent payment.";
  } else if (indicators.length > 0) {
    classification = "SPAM";
    confidence = 0.75;
    intent = "Unsolicited promotional or low-credibility messaging.";
  }

  const explanation =
    classification === "BENIGN"
      ? "No significant social engineering markers, credential requests, or deceptive routing cues were detected."
      : `Deterministic heuristic analysis identified ${indicators.length} primary social engineering signals. Intent: ${intent}`;

  const recommendedActions: string[] = [];
  if (classification === "PHISHING" || classification === "BEC") {
    recommendedActions.push("Do not click any embedded links or respond to the sender.");
    recommendedActions.push("Forward headers to your SOC / Information Security team.");
    recommendedActions.push("Verify unsolicited financial or credential requests via authorized out-of-band channels.");
  } else {
    recommendedActions.push("Standard caution applies. Verify sender address before interacting.");
  }

  return {
    classification,
    confidence,
    intent,
    urgencyLevel,
    indicators,
    explanation,
    recommendedActions,
    modelUsed: "mailtracer-deterministic-heuristics-v1",
    isFallback: true,
  };
}
