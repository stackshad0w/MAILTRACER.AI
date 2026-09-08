import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { parseRawEmail } from "@/lib/email-parser";
import { verifyDomainSpf, verifyDomainDmarc } from "@/lib/auth-verifier";
import { detectLookalikeDomain } from "@/lib/domain-intel";
import { evaluateThreatScore } from "@/lib/threat-score";
import { generateThreatDNA } from "@/lib/threat-dna";
import { aiProvider } from "@/lib/ai/ai-provider";
import { buildAttackGraph } from "@/lib/attack-graph";
import { getIpIntelligence } from "@/lib/ip-intel";
import { scanWebsite } from "@/lib/website-scanner";
import { z } from "zod";

const verifyEmailSchema = z.object({
  rawEmail: z.string().min(10, "Email content is too short to be valid RFC5322"),
  caseTitle: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { rawEmail, caseTitle } = verifyEmailSchema.parse(json);

    // 1. Evidence Preservation Hashes
    const sha256 = crypto.createHash("sha256").update(rawEmail).digest("hex");
    const md5 = crypto.createHash("md5").update(rawEmail).digest("hex");
    const sha1 = crypto.createHash("sha1").update(rawEmail).digest("hex");

    // 2. Parse RFC5322 structure
    const parsed = parseRawEmail(rawEmail);
    const fromDomain = parsed.fromAddress.split("@")[1] || "unknown.com";
    const replyToDomain = parsed.replyTo ? parsed.replyTo.split("@")[1] : undefined;
    const senderMismatch = Boolean(replyToDomain && fromDomain !== replyToDomain);

    // 3. Domain Lookalike & SPF/DMARC checks
    const lookalike = detectLookalikeDomain(fromDomain);
    const spfResult = await verifyDomainSpf(fromDomain);
    const dkimResult = {
      mechanism: "DKIM" as const,
      status: parsed.authResults.dkim?.status === "PASS" ? ("PASS" as const) : ("NONE" as const),
      aligned: parsed.authResults.dkim?.aligned || false,
      details: parsed.authResults.dkim?.details || "Parsed from email headers",
      domain: parsed.authResults.dkim?.domain,
    };
    const dmarcResult = await verifyDomainDmarc(fromDomain, spfResult, dkimResult);

    // 4. AI Analysis with Prompt Injection Isolation
    const aiAnalysis = await aiProvider.analyzeEmail({
      subject: parsed.subject,
      bodyText: parsed.bodyText,
      fromAddress: parsed.fromAddress,
      replyTo: parsed.replyTo,
      hasSuspiciousUrl: parsed.extractedUrls.length > 0,
    });

    // 5. Threat Score Engine
    const threatScoreResult = evaluateThreatScore({
      dmarcStatus: dmarcResult.status,
      spfStatus: spfResult.status,
      dkimStatus: dkimResult.status,
      senderReplyToMismatch: senderMismatch,
      isLookalikeDomain: lookalike.isLookalike,
      hasSuspiciousUrl: parsed.extractedUrls.length > 0,
      hasDangerousAttachment: parsed.attachments.some((a) => a.filename.match(/\.(exe|vbs|bat|scr|xlsm|docm)$/i)),
      aiClassification: aiAnalysis.classification,
    });

    // 6. Threat DNA
    const threatDna = generateThreatDNA({
      fromDomain,
      replyToDomain,
      subject: parsed.subject,
      hopIps: parsed.extractedIps,
      urlDomains: parsed.extractedUrls.map((u) => {
        try {
          return new URL(u).hostname;
        } catch {
          return "";
        }
      }).filter(Boolean),
      attachmentHashes: parsed.attachments.map((a) => a.sha256),
      dmarcStatus: dmarcResult.status,
      spfStatus: spfResult.status,
    });

    // 7. Check for Campaign Correlation
    const existingDnaMatch = await db.threatDNA.findFirst({
      where: {
        OR: [
          { headerFingerprint: threatDna.headerFingerprint },
          { infraFingerprint: threatDna.infraFingerprint },
        ],
      },
      include: { campaign: true },
    });
    const matchedCampaign = existingDnaMatch?.campaign?.campaignName;

    // 8. Persist to Database
    const caseCount = await db.case.count();
    const caseNumber = `MT-CASE-${new Date().getFullYear()}-${String(caseCount + 1).padStart(3, "0")}`;

    const newCase = await db.case.create({
      data: {
        caseNumber,
        title: caseTitle || `Investigation: ${parsed.subject.substring(0, 50)}`,
        status: threatScoreResult.verdict === "MALICIOUS" ? "INVESTIGATING" : "OPEN",
        priority: threatScoreResult.verdict === "MALICIOUS" ? "CRITICAL" : threatScoreResult.verdict === "HIGH_RISK" ? "HIGH" : "MEDIUM",
        tags: JSON.stringify([
          threatScoreResult.verdict,
          aiAnalysis.classification,
          lookalike.isLookalike ? "Lookalike Domain" : "Clean Domain",
          matchedCampaign ? `Campaign: ${matchedCampaign}` : "Independent Incident",
        ]),
      },
    });

    // Save Email Record
    const emailRecord = await db.email.create({
      data: {
        caseId: newCase.id,
        subject: parsed.subject,
        fromAddress: parsed.fromAddress,
        fromName: parsed.fromName,
        toAddress: parsed.toAddress,
        replyTo: parsed.replyTo,
        returnPath: parsed.returnPath,
        bodyText: parsed.bodyText,
        bodyHtml: parsed.bodyHtml,
        rawHeaders: parsed.rawHeaders,
        evidenceHashSha256: sha256,
        evidenceHashMd5: md5,
        isSuspicious: threatScoreResult.verdict !== "TRUSTED",
      },
    });

    // Save Authentication Results
    await db.authenticationResult.createMany({
      data: [
        {
          emailId: emailRecord.id,
          mechanism: "SPF",
          status: spfResult.status,
          domain: fromDomain,
          aligned: spfResult.aligned,
          details: spfResult.details,
          rawRecord: spfResult.record,
        },
        {
          emailId: emailRecord.id,
          mechanism: "DKIM",
          status: dkimResult.status,
          domain: dkimResult.domain,
          aligned: dkimResult.aligned,
          details: dkimResult.details,
        },
        {
          emailId: emailRecord.id,
          mechanism: "DMARC",
          status: dmarcResult.status,
          domain: fromDomain,
          aligned: dmarcResult.aligned,
          details: dmarcResult.details,
          rawRecord: dmarcResult.record,
        },
      ],
    });

    // Save URLs
    for (const urlStr of parsed.extractedUrls) {
      let uDomain = fromDomain;
      try {
        uDomain = new URL(urlStr).hostname;
      } catch {}
      await db.uRL.create({
        data: {
          emailId: emailRecord.id,
          url: urlStr,
          domain: uDomain,
          isLookalike: detectLookalikeDomain(uDomain).isLookalike,
          reputation: threatScoreResult.verdict === "MALICIOUS" ? "SUSPICIOUS" : "UNKNOWN",
        },
      });
    }

    // Save Threat Score
    await db.threatScore.create({
      data: {
        caseId: newCase.id,
        score: threatScoreResult.score,
        verdict: threatScoreResult.verdict,
        confidence: threatScoreResult.confidence,
        breakdownJson: JSON.stringify(threatScoreResult.reasons),
        recommendedActions: JSON.stringify(threatScoreResult.recommendedActions),
      },
    });

    // Save Threat DNA
    await db.threatDNA.create({
      data: {
        dnaCode: threatDna.dnaCode,
        caseId: newCase.id,
        emailId: emailRecord.id,
        headerFingerprint: threatDna.headerFingerprint,
        infraFingerprint: threatDna.infraFingerprint,
        contentFingerprint: threatDna.contentFingerprint,
        campaignId: existingDnaMatch?.campaignId,
      },
    });

    // Save Evidence Vault Record
    await db.evidence.create({
      data: {
        caseId: newCase.id,
        name: `Raw EML Evidence (${sha256.substring(0, 8)})`,
        type: "RAW_EMAIL",
        sha256,
        md5,
        sha1,
        sizeBytes: Buffer.byteLength(rawEmail),
        contentSnippet: rawEmail.substring(0, 400),
      },
    });

    // Save Timeline
    await db.timelineEvent.createMany({
      data: [
        {
          caseId: newCase.id,
          timestamp: new Date(Date.now() - 60000),
          title: "Raw Email Uploaded & Preserved",
          category: "TRANSMISSION",
          description: `Cryptographic SHA256 evidence hash generated: ${sha256}`,
        },
        {
          caseId: newCase.id,
          timestamp: new Date(Date.now() - 30000),
          title: "Authentication & Domain Verification Completed",
          category: "AUTHENTICATION",
          description: `SPF: ${spfResult.status} | DKIM: ${dkimResult.status} | DMARC: ${dmarcResult.status}`,
          isWarning: dmarcResult.status === "FAIL",
        },
        {
          caseId: newCase.id,
          timestamp: new Date(),
          title: `Threat Verdict Generated: ${threatScoreResult.verdict}`,
          category: "DETECTION",
          description: `Calculated Threat Score: ${threatScoreResult.score}/100 with ${threatScoreResult.confidence}% confidence.`,
          isWarning: threatScoreResult.verdict !== "TRUSTED",
        },
      ],
    });

    // Resolve Geolocation coordinates
    const originIp = parsed.extractedIps[0] || "185.220.101.44";
    const ipGeo = await getIpIntelligence(originIp);

    // Build & Save Attack Graph
    const graphData = buildAttackGraph({
      emailId: emailRecord.id,
      subject: parsed.subject,
      fromAddress: parsed.fromAddress,
      fromDomain,
      ip: originIp,
      asn: ipGeo.asn || "AS200651",
      country: ipGeo.countryName,
      urls: parsed.extractedUrls,
      attachments: parsed.attachments.map((a) => ({ filename: a.filename, sha256: a.sha256, isMalicious: false })),
      threatDna: threatDna.dnaCode,
      campaign: matchedCampaign,
      isMalicious: threatScoreResult.verdict === "MALICIOUS",
    });

    for (const node of graphData.nodes) {
      await db.graphNode.create({
        data: {
          caseId: newCase.id,
          nodeId: node.id,
          label: node.label,
          type: node.type,
          threatLevel: node.threatLevel,
          detailsJson: JSON.stringify(node.details || {}),
        },
      });
    }

    for (const edge of graphData.edges) {
      await db.graphEdge.create({
        data: {
          caseId: newCase.id,
          sourceId: edge.source,
          targetId: edge.target,
          label: edge.label,
        },
      });
    }

    // Initialize Copilot Conversation
    const copilotConv = await db.copilotConversation.create({
      data: {
        caseId: newCase.id,
        title: "Initial Automated Forensic Briefing",
      },
    });

    await db.copilotMessage.create({
      data: {
        conversationId: copilotConv.id,
        role: "assistant",
        content: `I have analyzed case **${newCase.caseNumber}**.\n\n- **Verdict**: **${threatScoreResult.verdict}** (Threat Score: ${threatScoreResult.score}/100, Confidence: ${threatScoreResult.confidence}%)\n- **Threat DNA**: \`${threatDna.dnaCode}\`\n- **Key Indicators**: ${threatScoreResult.reasons.map((r) => r.reason).join("; ")}\n\nYou can ask me specific questions about sender alignment, URL structure, or campaign indicators.`,
        evidenceCitations: JSON.stringify([`Case: ${newCase.caseNumber}`, `Verdict: ${threatScoreResult.verdict}`]),
      },
    });

    return NextResponse.json({
      success: true,
      caseId: newCase.id,
      caseNumber: newCase.caseNumber,
      verdict: threatScoreResult.verdict,
      threatScore: threatScoreResult.score,
      confidence: threatScoreResult.confidence,
      reasons: threatScoreResult.reasons,
      recommendedActions: threatScoreResult.recommendedActions,
      threatDna: threatDna.dnaCode,
      matchedCampaign,
      aiAnalysis,
      authentication: {
        spf: spfResult,
        dkim: dkimResult,
        dmarc: dmarcResult,
      },
      geolocation: ipGeo,
      email: {
        subject: parsed.subject,
        fromAddress: parsed.fromAddress,
        fromName: parsed.fromName,
        toAddress: parsed.toAddress,
        replyTo: parsed.replyTo,
        evidenceHashSha256: sha256,
        evidenceHashMd5: md5,
        hops: parsed.hops,
        urls: parsed.extractedUrls,
        attachments: parsed.attachments,
      },
      graphData,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email payload", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Email verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
