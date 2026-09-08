import { describe, it, expect } from "vitest";
import { generateThreatDNA, compareThreatDNA } from "../lib/threat-dna";

describe("Threat DNA Engine", () => {
  const inputA = {
    fromDomain: "microsoft-verify-portal.net",
    replyToDomain: "harvest-collector.su",
    subject: "Urgent: Microsoft 365 Password Expiration",
    hopIps: ["185.220.101.44"],
    urlDomains: ["microsoft-verify-portal.net"],
    dmarcStatus: "FAIL",
    spfStatus: "FAIL",
  };

  it("should generate standard MT-DNA-XXXXXXXX formatted code", () => {
    const dna = generateThreatDNA(inputA);
    expect(dna.dnaCode).toMatch(/^MT-DNA-[0-9A-F]{8}$/);
    expect(dna.headerFingerprint).toHaveLength(16);
    expect(dna.infraFingerprint).toHaveLength(16);
    expect(dna.contentFingerprint).toHaveLength(16);
  });

  it("should be deterministic for identical inputs", () => {
    const dna1 = generateThreatDNA(inputA);
    const dna2 = generateThreatDNA(inputA);
    expect(dna1.dnaCode).toBe(dna2.dnaCode);
    expect(compareThreatDNA(dna1, dna2)).toBe(1.0);
  });

  it("should differentiate distinct attack patterns", () => {
    const dnaA = generateThreatDNA(inputA);
    const dnaB = generateThreatDNA({
      fromDomain: "legitimate-vendor.com",
      subject: "Monthly Statement Summary",
      dmarcStatus: "PASS",
      spfStatus: "PASS",
    });

    expect(dnaA.dnaCode).not.toBe(dnaB.dnaCode);
    expect(compareThreatDNA(dnaA, dnaB)).toBeLessThan(0.5);
  });
});
