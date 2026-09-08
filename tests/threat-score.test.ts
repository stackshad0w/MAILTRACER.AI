import { describe, it, expect } from "vitest";
import { evaluateThreatScore } from "../lib/threat-score";

describe("Explainable Threat Scoring Engine", () => {
  it("should classify high-confidence phishing as MALICIOUS", () => {
    const result = evaluateThreatScore({
      dmarcStatus: "FAIL",
      spfStatus: "FAIL",
      senderReplyToMismatch: true,
      isLookalikeDomain: true,
      hasMaliciousUrl: true,
      hasCredentialForm: true,
      aiClassification: "PHISHING",
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.verdict).toBe("MALICIOUS");
    expect(result.reasons.length).toBeGreaterThanOrEqual(5);
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it("should classify legitimate email with passing auth as TRUSTED", () => {
    const result = evaluateThreatScore({
      dmarcStatus: "PASS",
      spfStatus: "PASS",
      dkimStatus: "PASS",
      senderReplyToMismatch: false,
      isLookalikeDomain: false,
      hasMaliciousUrl: false,
      aiClassification: "BENIGN",
    });

    expect(result.score).toBeLessThanOrEqual(20);
    expect(result.verdict).toBe("TRUSTED");
  });
});
