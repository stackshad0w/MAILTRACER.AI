import Link from "next/link";
import { db } from "@/lib/db";
import { Layers, ShieldAlert, ArrowRight, Dna, Target, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Active Threat Campaigns</h1>
            <p className="text-xs text-slate-400">
              Coordinated cyber attack clusters grouped by shared Threat DNA, infrastructure ASN, and lure payloads.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">CAMPAIGN CLUSTER</span>
                <h3 className="text-base font-bold text-slate-100">{camp.campaignName}</h3>
              </div>
              <span className="rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 px-2 py-0.5 text-xs font-bold">
                {camp.severity}
              </span>
            </div>

            <p className="text-xs text-slate-400">{camp.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded bg-slate-950 p-2 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">THREAT ACTOR</span>
                <span className="text-cyan-400 font-bold">{camp.threatActor || "Opportunistic Syndicate"}</span>
              </div>
              <div className="rounded bg-slate-950 p-2 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">LAST OBSERVED</span>
                <span className="text-slate-300 font-bold">{new Date(camp.lastSeen).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Correlated Cases */}
            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
                Correlated Cases ({camp.threatDNAs.length})
              </span>
              <div className="space-y-1.5">
                {camp.threatDNAs.map((td) => (
                  <div
                    key={td.id}
                    className="flex items-center justify-between rounded bg-slate-950/80 px-2.5 py-1.5 text-xs border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-purple-400">{td.dnaCode}</span>
                      <span className="text-slate-300 truncate max-w-xs">{td.case?.title || "Investigation"}</span>
                    </div>
                    {td.case && (
                      <Link
                        href={`/cases/${td.case.caseNumber}`}
                        className="text-cyan-400 hover:underline text-[11px] font-mono shrink-0 ml-2"
                      >
                        {td.case.caseNumber}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
