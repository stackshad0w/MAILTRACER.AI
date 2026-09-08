"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Network, 
  Layers, 
  Dna, 
  Clock, 
  Bot, 
  Key, 
  Link as LinkIcon, 
  Paperclip, 
  Terminal, 
  Globe, 
  Download,
  CheckCircle,
  AlertTriangle,
  Send
} from "lucide-react";
import { ThreatScoreGauge } from "@/components/threat-score-gauge";
import { VerificationMatrix } from "@/components/verification-matrix";
import { AttackGraphView } from "@/components/attack-graph-view";
import { AttackStory } from "@/components/attack-story";
import { EvidenceVault } from "@/components/evidence-vault";
import { TimelineView } from "@/components/timeline-view";
import { CopilotChat } from "@/components/copilot-chat";
import { VerificationMatrixRow, AttackGraphData } from "@/lib/types";

export function CaseClientView({ forensicCase }: { forensicCase: any }) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [status, setStatus] = useState(forensicCase.status);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const email = forensicCase.emails[0];
  const threatScore = forensicCase.threatScores[0];
  const threatDna = forensicCase.threatDNAs[0];
  const scoreVal = threatScore?.score ?? 50;
  const verdictVal = threatScore?.verdict || "INCONCLUSIVE";
  const confidenceVal = threatScore?.confidence ?? 70;

  // Build Verification Matrix rows
  let reasons: { reason: string; points: number; category?: string }[] = [];
  try {
    if (threatScore?.breakdownJson) {
      reasons = JSON.parse(threatScore.breakdownJson);
    }
  } catch {}

  let actions: string[] = [];
  try {
    if (threatScore?.recommendedActions) {
      actions = JSON.parse(threatScore.recommendedActions);
    }
  } catch {}

  const dmarcAuth = email?.authResults.find((a: any) => a.mechanism === "DMARC");
  const spfAuth = email?.authResults.find((a: any) => a.mechanism === "SPF");
  const dkimAuth = email?.authResults.find((a: any) => a.mechanism === "DKIM");

  const matrixRows: VerificationMatrixRow[] = [
    {
      signal: "SPF Authentication",
      result: spfAuth?.status || "NONE",
      source: "DNS SPF TXT Record",
      confidence: "High",
      status: spfAuth?.status === "PASS" ? "pass" : spfAuth?.status === "FAIL" ? "fail" : "warn",
    },
    {
      signal: "DKIM Signature",
      result: dkimAuth?.status || "NONE",
      source: "Header d= & DNS Key",
      confidence: "High",
      status: dkimAuth?.status === "PASS" ? "pass" : "warn",
    },
    {
      signal: "DMARC Alignment",
      result: dmarcAuth?.status || "NONE",
      source: "RFC 7489 Alignment",
      confidence: "High",
      status: dmarcAuth?.status === "PASS" ? "pass" : "fail",
    },
    {
      signal: "Domain Intelligence",
      result: reasons.some((r) => r.category === "DOMAIN") ? "Lookalike / Typosquatted" : "Clean DNS Records",
      source: "DNS & Brand Heuristics",
      confidence: "High",
      status: reasons.some((r) => r.category === "DOMAIN") ? "fail" : "pass",
    },
    {
      signal: "Embedded URL Telemetry",
      result: email?.urls?.length > 0 ? `${email.urls.length} Links Extracted` : "No Embedded Links",
      source: "SSRF-Safe HTTP Inspector",
      confidence: "High",
      status: reasons.some((r) => r.category === "URL") ? "fail" : "neutral",
    },
    {
      signal: "AI Intent Model",
      result: verdictVal === "MALICIOUS" ? "High-Urgency Lure Detected" : "Benign Communication",
      source: "Neural / Heuristic Model",
      confidence: "Medium",
      status: verdictVal === "MALICIOUS" ? "fail" : "pass",
    },
    {
      signal: "Threat DNA Correlation",
      result: threatDna?.dnaCode || "Synthesized",
      source: "Historical Cluster Matching",
      confidence: "High",
      status: threatDna?.campaign ? "fail" : "neutral",
    },
  ];

  // Attack Graph data assembly
  const graphData: AttackGraphData = {
    nodes: forensicCase.graphNodes.map((n: any) => ({
      id: n.nodeId,
      label: n.label,
      type: n.type,
      threatLevel: n.threatLevel,
    })),
    edges: forensicCase.graphEdges.map((e: any) => ({
      source: e.sourceId,
      target: e.targetId,
      label: e.label,
    })),
  };

  // Status feedback handler
  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/cases/${forensicCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: feedbackNote }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setFeedbackNote("");
      }
    } catch {
    } finally {
      setUpdating(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview & Verdict", icon: ShieldAlert },
    { id: "matrix", label: "Verification Matrix", icon: CheckCircle },
    { id: "graph", label: "Attack Graph", icon: Network },
    { id: "story", label: "Attack Story", icon: Terminal },
    { id: "headers", label: "Headers & Auth", icon: Key },
    { id: "links", label: "URLs & Websites", icon: LinkIcon },
    { id: "dna", label: "Threat DNA", icon: Dna },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "evidence", label: "Evidence Vault", icon: FileText },
    { id: "copilot", label: "Copilot Assistant", icon: Bot },
  ];

  return (
    <div className="space-y-6">
      {/* Top Dossier Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-cyan-400">{forensicCase.caseNumber}</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                STATUS: {status}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                PRIORITY: {forensicCase.priority}
              </span>
              {forensicCase.isDemo && (
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  DEMO / SYNTHETIC DATA
                </span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold text-slate-100">{forensicCase.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sender: <span className="font-mono text-cyan-300">{email?.fromAddress}</span> • Subject: &quot;{email?.subject}&quot;
            </p>
          </div>

          {/* Analyst Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleUpdateStatus("FALSE_POSITIVE")}
              disabled={updating || status === "FALSE_POSITIVE"}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-50 transition-all"
            >
              Mark False Positive
            </button>
            <button
              onClick={() => handleUpdateStatus("CONTAINED")}
              disabled={updating || status === "CONTAINED"}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-rose-500 hover:text-rose-400 disabled:opacity-50 transition-all"
            >
              Quarantine & Contain
            </button>
            <a
              href={`/api/reports/${forensicCase.caseNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Dossier</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Content */}
      <div className="space-y-6">
        {/* 1. OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <ThreatScoreGauge score={scoreVal} verdict={verdictVal} confidence={confidenceVal} />

              {/* Reasons Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
                  Scoring Breakdown & Reasoning
                </h4>
                <div className="space-y-2">
                  {reasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                      <span className="text-slate-300">{r.reason}</span>
                      <span className="font-mono font-bold text-rose-400 shrink-0 ml-2">+{r.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
                  Incident Narrative & Attack Story
                </h4>
                <AttackStory
                  verdict={verdictVal}
                  threatScore={scoreVal}
                  fromAddress={email?.fromAddress || "unknown"}
                  subject={email?.subject || ""}
                  dmarcStatus={dmarcAuth?.status}
                  hasLookalike={reasons.some((r) => r.category === "DOMAIN")}
                  urls={email?.urls || []}
                  threatDna={threatDna?.dnaCode}
                  campaign={threatDna?.campaign?.campaignName}
                  reasons={reasons}
                  recommendedActions={actions}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. VERIFICATION MATRIX */}
        {activeTab === "matrix" && (
          <div className="space-y-4">
            <VerificationMatrix rows={matrixRows} />
          </div>
        )}

        {/* 3. ATTACK GRAPH */}
        {activeTab === "graph" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Cytoscape.js Interactive Attack Graph</h3>
                <p className="text-xs text-slate-400">Trace entity links from Email & Sender to IP, Domain, Hashes, and Threat DNA.</p>
              </div>
            </div>
            <AttackGraphView graphData={graphData} />
          </div>
        )}

        {/* 4. ATTACK STORY */}
        {activeTab === "story" && (
          <div className="max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 border-b border-slate-800 pb-3">
              Forensic Attack Story Narrative
            </h3>
            <AttackStory
              verdict={verdictVal}
              threatScore={scoreVal}
              fromAddress={email?.fromAddress || "unknown"}
              subject={email?.subject || ""}
              dmarcStatus={dmarcAuth?.status}
              hasLookalike={reasons.some((r) => r.category === "DOMAIN")}
              urls={email?.urls || []}
              threatDna={threatDna?.dnaCode}
              campaign={threatDna?.campaign?.campaignName}
              reasons={reasons}
              recommendedActions={actions}
            />
          </div>
        )}

        {/* 5. HEADERS & AUTH */}
        {activeTab === "headers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase">SPF RECORD STATUS</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-lg font-bold ${spfAuth?.status === "PASS" ? "text-emerald-400" : "text-rose-400"}`}>
                    {spfAuth?.status || "NONE"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{spfAuth?.details || "No details"}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase">DKIM CRYPTO SIGNATURE</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-lg font-bold ${dkimAuth?.status === "PASS" ? "text-emerald-400" : "text-amber-400"}`}>
                    {dkimAuth?.status || "NONE"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{dkimAuth?.details || "No signature details"}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase">DMARC POLICY ALIGNMENT</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-lg font-bold ${dmarcAuth?.status === "PASS" ? "text-emerald-400" : "text-rose-400"}`}>
                    {dmarcAuth?.status || "FAIL"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{dmarcAuth?.details || "Failed alignment"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mb-2">Preserved RFC5322 Raw Headers</h4>
              <pre className="max-h-80 overflow-y-auto rounded bg-slate-950 p-3 font-mono text-[11px] text-slate-400 border border-slate-800">
                {email?.rawHeaders || "No raw headers recorded"}
              </pre>
            </div>
          </div>
        )}

        {/* 6. URLS & WEBSITES */}
        {activeTab === "links" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mb-3">Extracted URLs & Web Assets</h4>
              {email?.urls && email.urls.length > 0 ? (
                <div className="space-y-3">
                  {email.urls.map((u: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">{u.domain}</span>
                          {u.isLookalike && (
                            <span className="rounded bg-rose-500/20 text-rose-400 px-1.5 py-0.2 text-[10px] font-bold">
                              LOOKALIKE BRAND
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-mono text-slate-400 break-all">{u.url}</p>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                        {u.reputation}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No embedded URLs found in message content.</p>
              )}
            </div>
          </div>
        )}

        {/* 7. THREAT DNA */}
        {activeTab === "dna" && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-6 shadow-xl text-center">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
                SYNTHESIZED THREAT DNA FINGERPRINT
              </span>
              <h2 className="mt-2 text-3xl font-black font-mono text-purple-300 tracking-wider">
                {threatDna?.dnaCode || "MT-DNA-PENDING"}
              </h2>
              <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
                Deterministic hash signature calculated across routing hops, infrastructure ASN assets, and lexical lure features.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-500 text-[10px] uppercase">Header Fingerprint</span>
                <p className="mt-1 font-bold text-slate-200">{threatDna?.headerFingerprint || "N/A"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-500 text-[10px] uppercase">Infra Fingerprint</span>
                <p className="mt-1 font-bold text-slate-200">{threatDna?.infraFingerprint || "N/A"}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-500 text-[10px] uppercase">Content Fingerprint</span>
                <p className="mt-1 font-bold text-slate-200">{threatDna?.contentFingerprint || "N/A"}</p>
              </div>
            </div>
          </div>
        )}

        {/* 8. TIMELINE */}
        {activeTab === "timeline" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">
              Forensic Event & Transmission Timeline
            </h3>
            <TimelineView events={forensicCase.timelineEvents || []} />
          </div>
        )}

        {/* 9. EVIDENCE VAULT */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            <EvidenceVault evidences={forensicCase.evidences || []} />
          </div>
        )}

        {/* 10. COPILOT */}
        {activeTab === "copilot" && (
          <div className="space-y-4">
            <CopilotChat caseId={forensicCase.id} />
          </div>
        )}
      </div>
    </div>
  );
}
