import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forensicCase = await db.case.findFirst({
      where: { OR: [{ id }, { caseNumber: id }] },
      include: {
        emails: {
          include: {
            authResults: true,
            urls: true,
            attachments: true,
            aiAnalyses: true,
          },
        },
        threatScores: { orderBy: { createdAt: "desc" }, take: 1 },
        threatDNAs: { include: { campaign: true }, take: 1 },
        timelineEvents: { orderBy: { timestamp: "asc" } },
        evidences: true,
      },
    });

    if (!forensicCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const email = forensicCase.emails[0];
    const score = forensicCase.threatScores[0];
    const dna = forensicCase.threatDNAs[0];

    const reportData = {
      reportTitle: `MailTracer.ai Digital Forensics & Threat Report: ${forensicCase.caseNumber}`,
      caseNumber: forensicCase.caseNumber,
      generatedAt: new Date().toISOString(),
      investigator: "Alex Vance (Lead SOC Analyst)",
      finalVerdict: score?.verdict || "INCONCLUSIVE",
      threatScore: score?.score ?? 50,
      confidence: score?.confidence ?? 70,
      threatDna: dna?.dnaCode || "N/A",
      campaign: dna?.campaign?.campaignName || "None Correlated",
      executiveSummary: `Forensic examination of case ${forensicCase.caseNumber} concluded with a verdict of ${score?.verdict} (Threat Score: ${score?.score}/100, Confidence: ${score?.confidence}%). Key findings indicate ${score?.verdict === "MALICIOUS" ? "high-confidence adversarial indicators including deceptive routing and malicious payloads." : "routine communication with passing authentication."}`,
      emailDetails: {
        subject: email?.subject,
        from: email?.fromAddress,
        replyTo: email?.replyTo,
        returnPath: email?.returnPath,
        evidenceHashSha256: email?.evidenceHashSha256,
      },
      authenticationMatrix: email?.authResults.map((a) => ({
        mechanism: a.mechanism,
        status: a.status,
        aligned: a.aligned,
        details: a.details,
      })),
      urlsIdentified: email?.urls.map((u) => ({
        url: u.url,
        domain: u.domain,
        isLookalike: u.isLookalike,
        reputation: u.reputation,
      })),
      attachmentsIdentified: email?.attachments.map((att) => ({
        filename: att.filename,
        sha256: att.sha256,
        isMalicious: att.isMalicious,
        malwareType: att.malwareType,
      })),
      timeline: forensicCase.timelineEvents.map((e) => ({
        timestamp: e.timestamp,
        title: e.title,
        category: e.category,
        description: e.description,
      })),
      evidenceVault: forensicCase.evidences.map((ev) => ({
        name: ev.name,
        type: ev.type,
        sha256: ev.sha256,
        md5: ev.md5,
        sizeBytes: ev.sizeBytes,
      })),
      recommendedActions: score?.recommendedActions ? JSON.parse(score.recommendedActions) : [],
    };

    return NextResponse.json({ report: reportData });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to generate forensic report", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
