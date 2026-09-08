"use client";

import { ShieldCheck, Copy, Check, Download, FileCode } from "lucide-react";
import { useState } from "react";

interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  sha256: string;
  md5: string;
  sha1: string;
  sizeBytes: number;
  contentSnippet?: string;
  preservedAt: string | Date;
}

export function EvidenceVault({ evidences }: { evidences: EvidenceItem[] }) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <h4 className="text-sm font-bold text-slate-100">Cryptographic Chain of Custody</h4>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          All ingested emails, header streams, and payload artifacts are hashed via SHA256, SHA1, and MD5 immediately upon receipt. Immutable evidence records satisfy court-admissible forensic preservation standards.
        </p>
      </div>

      <div className="grid gap-3">
        {evidences.map((ev) => (
          <div
            key={ev.id}
            className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-xs text-slate-200">{ev.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  {ev.type}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {Math.round(ev.sizeBytes / 1024 * 10) / 10} KB
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(ev.preservedAt).toLocaleString()}
              </span>
            </div>

            {/* Hashes */}
            <div className="mt-3 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded bg-slate-900/90 px-2.5 py-1 text-slate-300">
                <span className="text-slate-500 font-semibold text-[10px]">SHA256:</span>
                <span className="text-cyan-300 break-all">{ev.sha256}</span>
                <button
                  onClick={() => handleCopy(ev.sha256)}
                  className="ml-2 text-slate-400 hover:text-slate-200"
                >
                  {copiedHash === ev.sha256 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between rounded bg-slate-900/90 px-2.5 py-1 text-slate-400">
                <span className="text-slate-500 font-semibold text-[10px]">MD5:</span>
                <span className="break-all">{ev.md5}</span>
                <button
                  onClick={() => handleCopy(ev.md5)}
                  className="ml-2 text-slate-400 hover:text-slate-200"
                >
                  {copiedHash === ev.md5 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Snippet Preview */}
            {ev.contentSnippet && (
              <div className="mt-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Preserved Snippet:</span>
                <pre className="mt-1 max-h-24 overflow-y-auto rounded bg-slate-900/50 p-2 font-mono text-[10px] text-slate-400 border border-slate-800/60">
                  {ev.contentSnippet}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
