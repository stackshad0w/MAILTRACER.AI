import crypto from "node:crypto";
import { ThreatDNAResult } from "./types";

export interface ThreatDNAInput {
  fromDomain: string;
  replyToDomain?: string;
  subject: string;
  hopIps?: string[];
  urlDomains?: string[];
  attachmentHashes?: string[];
  dmarcStatus?: string;
  spfStatus?: string;
}

/**
 * Computes a standardized Threat DNA fingerprint from multi-layer forensic attributes.
 * Formats: MT-DNA-XXXXXXXX (8 hex chars for quick SOC analyst reference)
 */
export function generateThreatDNA(input: ThreatDNAInput): ThreatDNAResult {
  // 1. Header fingerprint: reflects authentication and routing architecture
  const headerMaterial = [
    input.fromDomain.toLowerCase(),
    (input.replyToDomain || input.fromDomain).toLowerCase(),
    input.dmarcStatus || "NONE",
    input.spfStatus || "NONE",
    (input.hopIps || []).slice(0, 3).join(":"),
  ].join("|");
  const headerFingerprint = crypto
    .createHash("sha256")
    .update(headerMaterial)
    .digest("hex")
    .substring(0, 16);

  // 2. Infrastructure fingerprint: reflects network & domain assets
  const infraMaterial = [
    input.fromDomain.toLowerCase(),
    ...(input.urlDomains || []).map((d) => d.toLowerCase()).sort(),
  ].join("|");
  const infraFingerprint = crypto
    .createHash("sha256")
    .update(infraMaterial)
    .digest("hex")
    .substring(0, 16);

  // 3. Content fingerprint: reflects lure structure, subject tokens, and payload hashes
  const normalizedSubjectTokens = input.subject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .sort()
    .join(" ");

  const contentMaterial = [
    normalizedSubjectTokens,
    ...(input.attachmentHashes || []).sort(),
  ].join("|");
  const contentFingerprint = crypto
    .createHash("sha256")
    .update(contentMaterial)
    .digest("hex")
    .substring(0, 16);

  // Synthesize master DNA code
  const composite = `${headerFingerprint}:${infraFingerprint}:${contentFingerprint}`;
  const compositeHash = crypto
    .createHash("sha256")
    .update(composite)
    .digest("hex")
    .substring(0, 8)
    .toUpperCase();

  const dnaCode = `MT-DNA-${compositeHash}`;

  return {
    dnaCode,
    headerFingerprint,
    infraFingerprint,
    contentFingerprint,
  };
}

/**
 * Compares two Threat DNA results and returns a similarity score (0.0 to 1.0).
 */
export function compareThreatDNA(dnaA: ThreatDNAResult, dnaB: ThreatDNAResult): number {
  if (dnaA.dnaCode === dnaB.dnaCode) return 1.0;

  let matches = 0;
  if (dnaA.headerFingerprint === dnaB.headerFingerprint) matches += 0.35;
  if (dnaA.infraFingerprint === dnaB.infraFingerprint) matches += 0.40;
  if (dnaA.contentFingerprint === dnaB.contentFingerprint) matches += 0.25;

  return Math.round(matches * 100) / 100;
}
