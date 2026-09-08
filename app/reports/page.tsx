import Link from "next/link";
import { db } from "@/lib/db";
import { FileText, Download, Printer, ShieldAlert, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const cases = await db.case.findMany({
    include: {
      threatScores: { take: 1, orderBy: { createdAt: "desc" } },
      threatDNAs: true,
      emails: { select: { subject: true, fromAddress: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Forensic Investigation Reports</h1>
            <p className="text-xs text-slate-400">
              Audit-ready cybersecurity incident dossiers with cryptographic chain of custody and MITRE mappings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {cases.map((c) => {
          const score = c.threatScores[0]?.score ?? 50;
          const verdict = c.threatScores[0]?.verdict || "INCONCLUSIVE";
          const isDanger = verdict === "MALICIOUS" || verdict === "HIGH_RISK";

          return (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-colors shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">{c.caseNumber}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      isDanger
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {verdict}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Score: {score}/100</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-slate-200">{c.title}</h3>
                <p className="text-xs text-slate-400">Lead Investigator: Alex Vance (Lead SOC Analyst)</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/reports/${c.caseNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-400 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>JSON Dossier</span>
                </a>
                <Link
                  href={`/cases/${c.caseNumber}`}
                  className="flex items-center gap-1 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  <span>View Full Dossier</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
