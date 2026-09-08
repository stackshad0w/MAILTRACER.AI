import Link from "next/link";
import { db } from "@/lib/db";
import { FolderArchive, ShieldAlert, ArrowRight, Filter, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await db.case.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      threatScores: { take: 1, orderBy: { createdAt: "desc" } },
      threatDNAs: { take: 1 },
      emails: { select: { subject: true, fromAddress: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Forensic Investigation Cases</h1>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
              {cases.length} TOTAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active and resolved email and website threat dossiers with evidence chain of custody.
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Cases List */}
      <div className="grid gap-3">
        {cases.map((c) => {
          const score = c.threatScores[0]?.score ?? 50;
          const verdict = c.threatScores[0]?.verdict || "INCONCLUSIVE";
          const isDanger = verdict === "MALICIOUS" || verdict === "HIGH_RISK";
          const dna = c.threatDNAs[0]?.dnaCode;

          return (
            <div
              key={c.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 hover:border-cyan-500/40 hover:bg-slate-900 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/cases/${c.caseNumber}`}
                      className="font-mono text-sm font-bold text-cyan-400 hover:underline"
                    >
                      {c.caseNumber}
                    </Link>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        isDanger
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : verdict === "SUSPICIOUS"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {verdict} ({score}/100)
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      STATUS: {c.status}
                    </span>
                    {c.isDemo && (
                      <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                        DEMO
                      </span>
                    )}
                    {dna && (
                      <span className="rounded border border-purple-500/30 bg-purple-950/30 px-2 py-0.5 text-[10px] font-mono text-purple-400">
                        {dna}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-100 hover:text-cyan-300 transition-colors">
                    <Link href={`/cases/${c.caseNumber}`}>{c.title}</Link>
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-1">{c.description}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Sender: <span className="font-mono text-slate-300">{c.emails[0]?.fromAddress || "Unknown"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right hidden md:block">
                    <span className="text-[10px] text-slate-500 font-mono block">Ingested</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/cases/${c.caseNumber}`}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-all"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
