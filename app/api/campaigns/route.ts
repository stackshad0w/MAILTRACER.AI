import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      include: {
        threatDNAs: {
          include: {
            case: { select: { id: true, caseNumber: true, title: true, priority: true } },
          },
        },
        members: true,
      },
      orderBy: { lastSeen: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch campaigns", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
