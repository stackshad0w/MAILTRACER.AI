"use client";

import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { VerificationMatrixRow } from "@/lib/types";

export function VerificationMatrix({ rows }: { rows: VerificationMatrixRow[] }) {
  const getStatusBadge = (status: VerificationMatrixRow["status"], result: string) => {
    switch (status) {
      case "pass":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            {result}
          </span>
        );
      case "warn":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {result}
          </span>
        );
      case "fail":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-400">
            <XCircle className="h-3 w-3" />
            {result}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-400">
            <HelpCircle className="h-3 w-3" />
            {result}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
      <div className="border-b border-slate-800 px-4 py-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Deterministic Multi-Signal Verification Matrix
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Cross-validated across headers, DNS records, TLS certificates, threat feeds, and AI intent models.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono">
            <tr>
              <th className="px-4 py-2.5">SIGNAL</th>
              <th className="px-4 py-2.5">RESULT</th>
              <th className="px-4 py-2.5">SOURCE</th>
              <th className="px-4 py-2.5">CONFIDENCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-slate-200">{row.signal}</td>
                <td className="px-4 py-2.5">{getStatusBadge(row.status, row.result)}</td>
                <td className="px-4 py-2.5 font-mono text-slate-400">{row.source}</td>
                <td className="px-4 py-2.5 text-slate-300 font-medium">{row.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
