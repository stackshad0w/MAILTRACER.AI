import Link from "next/link";
import { db } from "@/lib/db";
import { Dna, ArrowRight, Layers, ShieldAlert, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ThreatDnaPage() {
  const threatDnas = await db.threatDNA.findMany({
    include: {
      case: { select: { id: true, caseNumber: true, title: true, priority: true } },
      campaign: { select: { campaignName: true, severity: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400">
            <Dna className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Threat DNA Engine</h1>
            <p className="text-xs text-slate-400">
              Cross-case cryptographic fingerprinting correlating routing topologies, DNS assets, and payload structures.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {threatDnas.map((dna) => (
          <div
            key={dna.id}
            className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 hover:border-purple-500/40 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-purple-400 tracking-wider">
                {dna.dnaCode}
              </span>
              {dna.campaign && (
                <span className="rounded bg-rose-500/20 text-rose-400 px-1.5 py-0.5 text-[10px] font-bold">
                  {dna.campaign.campaignName}
                </span>
              )}
            </div>

            {dna.case && (
              <div className="mt-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Associated Case</span>
                <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{dna.case.title}</h3>
                <Link
                  href={`/cases/${dna.case.caseNumber}`}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono"
                >
                  {dna.case.caseNumber} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center font-mono text-[9px] text-slate-400">
              <div className="rounded bg-slate-950 p-1.5 border border-slate-800/60">
                <span className="block text-slate-500 text-[8px]">HEADER</span>
                <span className="text-slate-300 truncate block">{dna.headerFingerprint || "—"}</span>
              </div>
              <div className="rounded bg-slate-950 p-1.5 border border-slate-800/60">
                <span className="block text-slate-500 text-[8px]">INFRA</span>
                <span className="text-slate-300 truncate block">{dna.infraFingerprint || "—"}</span>
              </div>
              <div className="rounded bg-slate-950 p-1.5 border border-slate-800/60">
                <span className="block text-slate-500 text-[8px]">CONTENT</span>
                <span className="text-slate-300 truncate block">{dna.contentFingerprint || "—"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
