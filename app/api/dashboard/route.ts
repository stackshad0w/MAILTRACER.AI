import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const totalCases = await db.case.count();
    const totalEmails = await db.email.count();
    const maliciousCases = await db.case.count({ where: { priority: "CRITICAL" } });
    const highRiskCases = await db.case.count({ where: { priority: "HIGH" } });
    const totalCampaigns = await db.campaign.count();
    const totalEvidence = await db.evidence.count();

    const recentCases = await db.case.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        threatScores: { take: 1, orderBy: { createdAt: "desc" } },
        threatDNAs: { take: 1 },
      },
    });

    const campaigns = await db.campaign.findMany({
      take: 4,
      orderBy: { severity: "desc" },
      include: { threatDNAs: true },
    });

    return NextResponse.json({
      stats: {
        totalCases,
        totalEmails,
        threatsDetected: maliciousCases + highRiskCases,
        criticalThreats: maliciousCases,
        activeCampaigns: totalCampaigns,
        preservedEvidenceCount: totalEvidence,
      },
      recentCases: recentCases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        priority: c.priority,
        verdict: c.threatScores[0]?.verdict || "PENDING",
        threatScore: c.threatScores[0]?.score ?? 50,
        dnaCode: c.threatDNAs[0]?.dnaCode || "N/A",
        isDemo: c.isDemo,
        createdAt: c.createdAt,
      })),
      campaigns,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to load dashboard metrics", details: error instanceof Error ? error.message : "Database error" },
      { status: 500 }
    );
  }
}
