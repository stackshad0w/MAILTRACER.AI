import { describe, it, expect } from "vitest";
import { parseRawEmail, extractUrls, extractIps } from "../lib/email-parser";

describe("Email Parser & Header Forensics Engine", () => {
  const sampleEmail = `From: "IT Support" <admin@microsoft-verify-portal.net>
To: victim@company.com
Reply-To: phisher@harvest-site.su
Subject: Immediate Action Required: Verify Account
Date: Tue, 08 Sep 2026 10:00:00 +0000
Message-ID: <test-12345@portal.net>
Received: from mail.attacker.org (mail.attacker.org [185.220.101.44]) by mx.victim.com
Authentication-Results: spf=fail (sender IP not authorized); dkim=none; dmarc=fail

Dear User,
Please verify your credentials immediately at https://login.microsoft-verify-portal.net/auth
Thank you.`;

  it("should parse RFC5322 headers accurately", () => {
    const parsed = parseRawEmail(sampleEmail);
    expect(parsed.fromAddress).toBe("admin@microsoft-verify-portal.net");
    expect(parsed.fromName).toBe("IT Support");
    expect(parsed.toAddress).toBe("victim@company.com");
    expect(parsed.replyTo).toBe("phisher@harvest-site.su");
    expect(parsed.subject).toBe("Immediate Action Required: Verify Account");
  });

  it("should extract embedded URLs and IPs", () => {
    const parsed = parseRawEmail(sampleEmail);
    expect(parsed.extractedUrls).toContain("https://login.microsoft-verify-portal.net/auth");
    expect(parsed.extractedIps).toContain("185.220.101.44");
  });

  it("should parse authentication header results", () => {
    const parsed = parseRawEmail(sampleEmail);
    expect(parsed.authResults.spf?.status).toBe("FAIL");
    expect(parsed.authResults.dmarc?.status).toBe("FAIL");
  });

  it("should extract chronological Received hops", () => {
    const parsed = parseRawEmail(sampleEmail);
    expect(parsed.hops.length).toBeGreaterThan(0);
    expect(parsed.hops[0].ip).toBe("185.220.101.44");
  });
});
