import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const demoDataPath = path.join(__dirname, "../lib/seed-data.json");
const SYNTHETIC_DEMO_CASES = JSON.parse(fs.readFileSync(demoDataPath, "utf-8"));

async function main() {
  console.log("🌱 Seeding MailTracer.ai database with demonstration cyber forensics scenarios...");

  // Create standard analyst user
  const analyst = await prisma.user.upsert({
    where: { email: "analyst@mailtracer.ai" },
    update: {},
    create: {
      name: "Alex Vance (Lead SOC Analyst)",
      email: "analyst@mailtracer.ai",
      role: "ANALYST",
    },
  });

  for (const demo of SYNTHETIC_DEMO_CASES) {
    // 1. Create or update Campaign if present
    let campaignId = null;
    if (demo.campaign) {
      const campaign = await prisma.campaign.upsert({
        where: { campaignName: demo.campaign },
        update: {},
        create: {
          campaignName: demo.campaign,
          severity: demo.priority,
          threatActor: demo.campaign.includes("AgentTesla") ? "FIN7" : "Opportunistic Phishing Syndicate",
          targetSectors: JSON.stringify(["Finance", "Enterprise Services", "Healthcare"]),
          indicatorsCount: 14,
          description: `Active campaign tracked by MailTracer.ai automated correlation engine.`,
        },
      });
      campaignId = campaign.id;
    }

    // 2. Create Case
    const c = await prisma.case.upsert({
      where: { caseNumber: demo.caseNumber },
      update: {},
      create: {
        caseNumber: demo.caseNumber,
        title: demo.title,
        description: demo.description,
        status: demo.status,
        priority: demo.priority,
        isDemo: true,
        tags: JSON.stringify(demo.tags),
        assignedToId: analyst.id,
      },
    });

    // 3. Create Email
    const emailRaw = `From: ${demo.email.fromName || ""} <${demo.email.fromAddress}>\nSubject: ${demo.email.subject}\n\n${demo.email.bodyText}`;
    const emailHash = crypto.createHash("sha256").update(emailRaw).digest("hex");

    const email = await prisma.email.create({
      data: {
        caseId: c.id,
        subject: demo.email.subject,
        fromAddress: demo.email.fromAddress,
        fromName: demo.email.fromName,
        toAddress: demo.email.toAddress,
        replyTo: demo.email.replyTo,
        returnPath: demo.email.returnPath,
        bodyText: demo.email.bodyText,
        rawHeaders: `Received: from mail.relay.org by mx.enterprise-victim.com\nFrom: ${demo.email.fromAddress}\nSubject: ${demo.email.subject}`,
        evidenceHashSha256: emailHash,
        isSuspicious: demo.verdict !== "TRUSTED",
      },
    });

    // 4. Create Threat Score
    await prisma.threatScore.create({
      data: {
        caseId: c.id,
        score: demo.threatScore,
        verdict: demo.verdict,
        confidence: demo.confidence,
        breakdownJson: JSON.stringify(demo.email.reasons),
        recommendedActions: JSON.stringify([
          demo.verdict === "MALICIOUS" ? "Quarantine message from mailboxes" : "Standard verification",
          "Block offending domain at DNS level",
        ]),
      },
    });

    // 5. Create Threat DNA
    if (demo.threatDna) {
      await prisma.threatDNA.upsert({
        where: { dnaCode: demo.threatDna },
        update: {},
        create: {
          dnaCode: demo.threatDna,
          caseId: c.id,
          emailId: email.id,
          campaignId,
          headerFingerprint: demo.threatDna.substring(7, 15),
          infraFingerprint: demo.threatDna.substring(7, 15),
          contentFingerprint: demo.threatDna.substring(7, 15),
        },
      });
    }

    // 6. Create Evidence Vault records
    await prisma.evidence.create({
      data: {
        caseId: c.id,
        name: "Original Raw RFC5322 EML Message",
        type: "RAW_EMAIL",
        sha256: emailHash,
        md5: crypto.createHash("md5").update(emailRaw).digest("hex"),
        sha1: crypto.createHash("sha1").update(emailRaw).digest("hex"),
        sizeBytes: Buffer.byteLength(emailRaw),
        contentSnippet: emailRaw.substring(0, 300),
      },
    });

    // 7. Create Timeline Events
    await prisma.timelineEvent.createMany({
      data: [
        {
          caseId: c.id,
          timestamp: new Date(Date.now() - 3600000),
          title: "Message Transmission Observed",
          category: "TRANSMISSION",
          description: `Inbound SMTP transmission routed via ${demo.email.ip || "198.51.100.1"}.`,
        },
        {
          caseId: c.id,
          timestamp: new Date(Date.now() - 1800000),
          title: "Authentication Forensics Completed",
          category: "AUTHENTICATION",
          description: `SPF: ${demo.email.authResults.spf.status}, DKIM: ${demo.email.authResults.dkim.status}, DMARC: ${demo.email.authResults.dmarc.status}.`,
          isWarning: demo.email.authResults.dmarc.status === "FAIL",
        },
        {
          caseId: c.id,
          timestamp: new Date(),
          title: `Threat Verdict Generated: ${demo.verdict}`,
          category: "DETECTION",
          description: `Explainable score calculated: ${demo.threatScore}/100 (${demo.confidence}% confidence).`,
          isWarning: demo.verdict !== "TRUSTED",
        },
      ],
    });

    // 8. Create Graph Nodes and Edges
    const emailNodeId = `node-email-${c.id}`;
    const senderNodeId = `node-sender-${c.id}`;
    await prisma.graphNode.createMany({
      data: [
        {
          caseId: c.id,
          nodeId: emailNodeId,
          label: demo.email.subject.substring(0, 20) + "...",
          type: "EMAIL",
          threatLevel: demo.verdict === "MALICIOUS" ? "DANGER" : "INFO",
        },
        {
          caseId: c.id,
          nodeId: senderNodeId,
          label: demo.email.fromAddress,
          type: "SENDER",
          threatLevel: demo.verdict === "MALICIOUS" ? "WARNING" : "SAFE",
        },
      ],
    });

    await prisma.graphEdge.create({
      data: {
        caseId: c.id,
        sourceId: emailNodeId,
        targetId: senderNodeId,
        label: "SENT_FROM",
      },
    });

    // 9. Initial Copilot conversation
    const conv = await prisma.copilotConversation.create({
      data: {
        caseId: c.id,
        title: "Initial Automated Forensic Briefing",
      },
    });

    await prisma.copilotMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: `I have completed multi-signal analysis for **${demo.caseNumber}**. Verdict: **${demo.verdict}** (Score: ${demo.threatScore}/100, Confidence: ${demo.confidence}%). Ask me any question regarding sender verification, link analysis, or related campaign infrastructure.`,
        evidenceCitations: JSON.stringify([`Case: ${demo.caseNumber}`, `Verdict: ${demo.verdict}`]),
      },
    });
  }

  console.log("✅ MailTracer.ai seed completed successfully with 4 synthetic scenarios!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
