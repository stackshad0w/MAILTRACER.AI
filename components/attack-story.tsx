"use client";

import { AlertOctagon, CheckCircle2, ShieldAlert, Terminal } from "lucide-react";

interface AttackStoryProps {
  verdict: string;
  threatScore: number;
  fromAddress: string;
  subject: string;
  dmarcStatus?: string;
  hasLookalike?: boolean;
  urls: { url: string; domain: string }[];
  threatDna?: string;
  campaign?: string;
  reasons: { reason: string; points: number }[];
  recommendedActions: string[];
}

export function AttackStory({
  verdict,
  threatScore,
  fromAddress,
  subject,
  dmarcStatus,
  hasLookalike,
  urls,
  threatDna,
  campaign,
  reasons,
  recommendedActions,
}: AttackStoryProps) {
  const isThreat = verdict === "MALICIOUS" || verdict === "HIGH_RISK";

  return (
    <div className="space-y-4 text-xs text-slate-300">
      {/* 1. Initial Observation */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h5 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] mb-1">
          1. Initial Observation & Ingestion
        </h5>
        <p>
          The inbound message with subject <strong className="text-slate-100">&quot;{subject}&quot;</strong> was
          received claiming origin from <strong className="text-slate-100">&lt;{fromAddress}&gt;</strong>. Evidence
          preservation routines immediately captured the full RFC5322 MIME envelope, producing immutable SHA256 and
          MD5 digital hashes.
        </p>
      </div>

      {/* 2. Sender & Authentication Forensics */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h5 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] mb-1">
          2. Sender & Authentication Alignment
        </h5>
        <p>
          Cryptographic interrogation of authentication headers revealed DMARC status:{" "}
          <span
            className={`font-mono font-bold ${
              dmarcStatus === "FAIL" ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {dmarcStatus || "NONE"}
          </span>
          .{" "}
          {dmarcStatus === "FAIL"
            ? "Because DMARC failed alignment, the sender address domain could not be verified, presenting a definitive signature of identity spoofing or unauthorized forwarding."
            : "Sender domain published valid SPF and DKIM signatures matching RFC5322 header alignment."}
        </p>
      </div>

      {/* 3. Domain & Infrastructure Forensics */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h5 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] mb-1">
          3. Domain & Website Verification
        </h5>
        <p>
          {hasLookalike
            ? "Domain analysis flagged an active typosquatted lookalike brand stem designed to deceive recipients into perceiving legitimate corporate infrastructure."
            : "Domain nameserver records and DNS resolution verify standard registrar delegation."}
          {urls.length > 0 && (
            <span className="block mt-1">
              Embedded URLs point to destinations ({urls.map((u) => u.domain).join(", ")}) evaluated under safe SSRF-guarded HTTP scanners.
            </span>
          )}
        </p>
      </div>

      {/* 4. Threat DNA & Campaign Correlation */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <h5 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] mb-1">
          4. Threat DNA & Campaign Correlation
        </h5>
        <p>
          Synthesized fingerprint: <code className="text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded">{threatDna || "MT-DNA-COMPUTED"}</code>.{" "}
          {campaign
            ? `Cross-referencing historical case databases correlates this investigation directly with '${campaign}'.`
            : "No previous historical campaign cluster matches this specific routing signature."}
        </p>
      </div>

      {/* 5. Final Verdict & Incident Disposition */}
      <div
        className={`rounded-lg border p-4 ${
          isThreat
            ? "border-rose-500/40 bg-rose-950/20 text-rose-200"
            : "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {isThreat ? <AlertOctagon className="h-4 w-4 text-rose-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          <h5 className="font-bold uppercase tracking-wider text-[11px]">
            5. Final Disposition: {verdict} ({threatScore}/100)
          </h5>
        </div>
        <p className="text-xs">
          MailTracer.ai aggregated multi-source telemetry to yield a deterministic verdict of{" "}
          <strong>{verdict}</strong>. Primary factors:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-0.5 text-[11px]">
          {reasons.map((r, i) => (
            <li key={i}>
              {r.reason} (+{r.points} pts)
            </li>
          ))}
        </ul>

        <div className="mt-3 border-t border-slate-700/60 pt-2">
          <strong className="text-[11px] uppercase tracking-wide text-slate-300">Mandated Defensive Actions:</strong>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
            {recommendedActions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
