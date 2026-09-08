"use client";

import { useRouter } from "next/navigation";
import { X, ShieldAlert, AlertTriangle, Bug, CheckCircle2, ArrowRight } from "lucide-react";
import { SYNTHETIC_DEMO_CASES } from "@/lib/seed-data";

export function DemoCasesModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const handleSelectCase = (caseNumber: string) => {
    onClose();
    router.push(`/cases/${caseNumber}`);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "MALICIOUS":
        return <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-semibold text-rose-400">MALICIOUS</span>;
      case "HIGH_RISK":
        return <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-semibold text-amber-400">HIGH RISK</span>;
      case "SUSPICIOUS":
        return <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 text-xs font-semibold text-yellow-400">SUSPICIOUS</span>;
      case "TRUSTED":
        return <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-semibold text-emerald-400">TRUSTED</span>;
      default:
        return <span className="rounded bg-slate-500/20 border border-slate-500/40 px-2 py-0.5 text-xs font-semibold text-slate-400">{verdict}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Pre-Configured Forensic Scenarios</h2>
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                SYNTHETIC DEMO DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any pre-analyzed case to inspect the full multi-signal investigation dossier and Attack Graph.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Case Cards */}
        <div className="mt-4 grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {SYNTHETIC_DEMO_CASES.map((demo) => {
            return (
              <div
                key={demo.caseNumber}
                onClick={() => handleSelectCase(demo.caseNumber)}
                className="group cursor-pointer rounded-lg border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-800/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-cyan-400">{demo.caseNumber}</span>
                      {getVerdictBadge(demo.verdict)}
                      <span className="text-xs text-slate-400">Threat Score: <strong className="text-slate-200">{demo.threatScore}/100</strong></span>
                      <span className="text-xs text-slate-500">Confidence: {demo.confidence}%</span>
                    </div>

                    <h3 className="mt-1 text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {demo.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{demo.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {demo.tags.map((tag) => (
                        <span key={tag} className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                          {tag}
                        </span>
                      ))}
                      <span className="font-mono text-[10px] text-cyan-400/80 bg-cyan-950/40 border border-cyan-500/20 rounded px-1.5 py-0.5">
                        {demo.threatDna}
                      </span>
                    </div>
                  </div>

                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <span>Synthetic cases comply with strict testing standards. Zero production secrets or real corporate data.</span>
          <button
            onClick={onClose}
            className="rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
