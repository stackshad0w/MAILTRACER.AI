import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateCaseSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "CONTAINED", "RESOLVED", "FALSE_POSITIVE", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forensicCase = await db.case.findFirst({
      where: {
        OR: [{ id }, { caseNumber: id }],
      },
      include: {
        emails: {
          include: {
            headers: true,
            authResults: true,
            urls: { include: { websiteScans: true } },
            attachments: true,
            aiAnalyses: true,
          },
        },
        threatScores: { orderBy: { createdAt: "desc" } },
        threatDNAs: { include: { campaign: true } },
        timelineEvents: { orderBy: { timestamp: "asc" } },
        evidences: true,
        graphNodes: true,
        graphEdges: true,
        reports: true,
        copilotConvs: {
          include: { messages: { orderBy: { createdAt: "asc" } } },
        },
      },
    });

    if (!forensicCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({ case: forensicCase });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch case", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = updateCaseSchema.parse(json);

    const updated = await db.case.update({
      where: { id },
      data: {
        status: parsed.status,
        priority: parsed.priority,
      },
    });

    // Record audit log for analyst feedback loop
    await db.auditLog.create({
      data: {
        caseId: id,
        action: `ANALYST_STATUS_UPDATE_${parsed.status || "MODIFIED"}`,
        details: parsed.notes || `Analyst changed status to ${parsed.status}`,
      },
    });

    return NextResponse.json({ case: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to update case", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
