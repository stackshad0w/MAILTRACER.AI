import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CaseClientView } from "./case-client-view";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    },
  });

  if (!forensicCase) {
    notFound();
  }

  return <CaseClientView forensicCase={forensicCase} />;
}
