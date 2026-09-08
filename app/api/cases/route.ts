import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createCaseSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;

    const cases = await db.case.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        threatScores: { take: 1, orderBy: { createdAt: "desc" } },
        threatDNAs: { take: 1 },
        emails: { select: { subject: true, fromAddress: true } },
      },
    });

    return NextResponse.json({ cases });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch cases", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createCaseSchema.parse(json);

    const count = await db.case.count();
    const caseNumber = `MT-CASE-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const newCase = await db.case.create({
      data: {
        caseNumber,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        tags: JSON.stringify(parsed.tags || []),
        status: "OPEN",
      },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create case", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
