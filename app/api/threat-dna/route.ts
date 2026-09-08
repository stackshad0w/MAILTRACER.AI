import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const dnas = await db.threatDNA.findMany({
      include: {
        case: { select: { caseNumber: true, title: true, priority: true } },
        campaign: { select: { campaignName: true, severity: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ threatDNAs: dnas });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch Threat DNAs", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
