import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { answerInvestigatorQuery } from "@/lib/ai/copilot-rag";
import { z } from "zod";

const copilotRequestSchema = z.object({
  caseId: z.string(),
  question: z.string().min(2, "Question cannot be empty"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { caseId, question } = copilotRequestSchema.parse(json);

    const forensicCase = await db.case.findFirst({
      where: { OR: [{ id: caseId }, { caseNumber: caseId }] },
      include: {
        emails: {
          include: {
            authResults: true,
            urls: true,
            attachments: true,
          },
        },
        threatScores: { orderBy: { createdAt: "desc" }, take: 1 },
        threatDNAs: { include: { campaign: true }, take: 1 },
        copilotConvs: { take: 1 },
      },
    });

    if (!forensicCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const email = forensicCase.emails[0];
    const score = forensicCase.threatScores[0];
    const dna = forensicCase.threatDNAs[0];

    const dmarc = email?.authResults.find((a) => a.mechanism === "DMARC")?.status;
    const spf = email?.authResults.find((a) => a.mechanism === "SPF")?.status;
    const dkim = email?.authResults.find((a) => a.mechanism === "DKIM")?.status;

    let reasonsParsed: { reason: string; points: number }[] = [];
    try {
      if (score?.breakdownJson) {
        reasonsParsed = JSON.parse(score.breakdownJson);
      }
    } catch {}

    const answer = answerInvestigatorQuery(question, {
      caseNumber: forensicCase.caseNumber,
      verdict: score?.verdict || "INCONCLUSIVE",
      threatScore: score?.score ?? 50,
      confidence: score?.confidence ?? 70,
      fromAddress: email?.fromAddress || "unknown@domain.com",
      replyTo: email?.replyTo || undefined,
      subject: email?.subject || "Investigation Subject",
      dmarcStatus: dmarc,
      spfStatus: spf,
      dkimStatus: dkim,
      urls: (email?.urls || []).map((u) => ({ url: u.url, domain: u.domain, reputation: u.reputation })),
      attachments: (email?.attachments || []).map((a) => ({ filename: a.filename, sha256: a.sha256, isMalicious: a.isMalicious })),
      threatDna: dna?.dnaCode,
      campaign: dna?.campaign?.campaignName,
      reasons: reasonsParsed,
    });

    // Save message into conversation history if present
    const conv = forensicCase.copilotConvs[0];
    if (conv) {
      await db.copilotMessage.create({
        data: {
          conversationId: conv.id,
          role: "user",
          content: question,
        },
      });

      await db.copilotMessage.create({
        data: {
          conversationId: conv.id,
          role: "assistant",
          content: answer.content,
          evidenceCitations: JSON.stringify(answer.evidenceCitations),
        },
      });
    }

    return NextResponse.json({
      success: true,
      answer: answer.content,
      evidenceCitations: answer.evidenceCitations,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Copilot reasoning failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
