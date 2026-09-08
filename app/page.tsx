"use client";

import { useState, useRef } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Globe, 
  Key, 
  Link as LinkIcon, 
  FileText, 
  Terminal, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  Bot, 
  Network,
  RotateCcw,
  Zap
} from "lucide-react";
import { GeoMap } from "@/components/geo-map";
import { AttackGraphView } from "@/components/attack-graph-view";
import { CopilotChat } from "@/components/copilot-chat";
import { SYNTHETIC_DEMO_CASES } from "@/lib/seed-data";

export default function UnifiedForensicPage() {
  const [rawEmail, setRawEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // 1-Click One-Shot Investigation Engine
  const runOneClickInvestigation = async (emailPayload?: string) => {
    const textToAnalyze = emailPayload !== undefined ? emailPayload : rawEmail;

    if (!textToAnalyze.trim()) {
      setError("Please paste an email or select one of the 1-Click Test Scenarios above.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    // Dynamic analysis stage progress sequence
    setAnalysisStage("Preserving Evidence Hash (SHA256 / MD5)...");
    const t1 = setTimeout(() => setAnalysisStage("Interrogating Routing Hops & Geolocation Infrastructure..."), 300);
    const t2 = setTimeout(() => setAnalysisStage("Verifying SPF, DKIM & DMARC Cryptographic Alignment..."), 600);
    const t3 = setTimeout(() => setAnalysisStage("Scanning Embedded Links under SSRF Safeguards..."), 900);
    const t4 = setTimeout(() => setAnalysisStage("Running AI Threat Intent & Social Engineering Detection..."), 1200);
    const t5 = setTimeout(() => setAnalysisStage("Synthesizing Threat DNA & Correlating Attack Graph..."), 1500);

    try {
      const res = await fetch("/api/verify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawEmail: textToAnalyze }),
      });
      const data = await res.json();

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);

      if (data.success) {
        setResult(data);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } else {
        setError(data.error || "Forensic analysis failed");
      }
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      setError("Network timeout communicating with forensic verification engine.");
    } finally {
      setLoading(false);
      setAnalysisStage("");
    }
  };

  // 1-Click Sample Trigger
  const triggerSampleTest = (index: number) => {
    const demo = SYNTHETIC_DEMO_CASES[index];
    const sample = `From: ${demo.email.fromName || "Sender"} <${demo.email.fromAddress}>
To: ${demo.email.toAddress}
Reply-To: ${demo.email.replyTo || demo.email.fromAddress}
Subject: ${demo.email.subject}
Date: ${new Date().toUTCString()}
Received: from mail.relay.org (mail.relay.org [${demo.email.ip || "185.220.101.44"}]) by mx.enterprise-victim.com
Authentication-Results: spf=${demo.email.authResults.spf.status} (${demo.email.authResults.spf.details}); dkim=${demo.email.authResults.dkim.status}; dmarc=${demo.email.authResults.dmarc.status}

${demo.email.bodyText}`;

    setRawEmail(sample);
    runOneClickInvestigation(sample);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="text-center pt-2 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1 text-xs text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Zap className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">ONE-CLICK MULTI-LAYER FORENSIC INTELLIGENCE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-100">
          AI Email Threat Detection, Geolocation <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            & Cyber Forensics Platform
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
          One click verifies trust level, traces BGP IP geolocation, validates SPF/DKIM/DMARC authentication, inspects websites, classifies threat intent, and generates interactive attack graphs.
        </p>
      </div>

      {/* 1-Click Instant Test Scenario Buttons */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            TRY 1-CLICK TEST SCENARIOS:
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">INSTANT VERIFICATION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => triggerSampleTest(0)}
            disabled={loading}
            className="flex flex-col text-left p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-500/60 transition-all group disabled:opacity-50 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 font-mono">
              <span>TEST 1: PHISHING</span>
              <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.2 rounded">92/100</span>
            </div>
            <span className="mt-1 text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              Microsoft 365 Credential Theft
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Lookalike domain + password form + DMARC fail
            </span>
          </button>

          <button
            onClick={() => triggerSampleTest(1)}
            disabled={loading}
            className="flex flex-col text-left p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-500/60 transition-all group disabled:opacity-50 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 font-mono">
              <span>TEST 2: BEC FRAUD</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded">82/100</span>
            </div>
            <span className="mt-1 text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              CEO Wire Transfer Impersonation
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Urgent $142,500 wire + Reply-To diversion
            </span>
          </button>

          <button
            onClick={() => triggerSampleTest(2)}
            disabled={loading}
            className="flex flex-col text-left p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-500/60 transition-all group disabled:opacity-50 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-400 font-mono">
              <span>TEST 3: MALWARE</span>
              <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.2 rounded">98/100</span>
            </div>
            <span className="mt-1 text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              Trojan Invoice Macro Dropper
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Weaponized .xlsm workbook + known hash
            </span>
          </button>

          <button
            onClick={() => triggerSampleTest(3)}
            disabled={loading}
            className="flex flex-col text-left p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500/60 transition-all group disabled:opacity-50 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 font-mono">
              <span>TEST 4: BENIGN</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded">08/100</span>
            </div>
            <span className="mt-1 text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              Legitimate Cloud Newsletter
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Passing SPF, DKIM, and DMARC alignment
            </span>
          </button>
        </div>
      </div>

      {/* Main Analysis Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            Input Console: Paste Raw RFC5322 EML Message, Headers, or Links
          </span>
          {rawEmail && (
            <button
              onClick={() => setRawEmail("")}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 font-mono"
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        <textarea
          value={rawEmail}
          onChange={(e) => setRawEmail(e.target.value)}
          placeholder={`From: security@microsoft-verify-portal.net\nTo: target@victim.com\nReply-To: phisher@harvest-site.su\nSubject: Urgent: Password Expiration Notice\nReceived: from mail.relay.org (mail.relay.org [185.220.101.44]) by mx.victim.com\n\nPlease verify your account immediately at https://login.microsoft-verify-portal.net/auth`}
          rows={6}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Big Action Button */}
        <button
          onClick={() => runOneClickInvestigation()}
          disabled={loading || !rawEmail.trim()}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 py-3.5 text-sm font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{analysisStage || "Executing Deep Cyber Forensic Investigation..."}</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 text-slate-950 fill-current" />
              <span>RUN 1-CLICK DEEP FORENSIC INVESTIGATION & TRACE</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* RESULTS DISPLAY: FULL FORENSIC REPORT SCREEN (INSTANT & COMPLETE) */}
      {/* ========================================================================= */}
      {result && (
        <div ref={resultsRef} className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Section 1: Master Threat Verdict Banner */}
          <div
            className={`rounded-2xl border p-6 backdrop-blur-md shadow-2xl transition-all ${
              result.verdict === "MALICIOUS"
                ? "border-rose-500/50 bg-rose-950/30 shadow-[0_0_30px_rgba(244,63,94,0.25)]"
                : result.verdict === "HIGH_RISK"
                ? "border-amber-500/50 bg-amber-950/30 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                : result.verdict === "SUSPICIOUS"
                ? "border-yellow-500/50 bg-yellow-950/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                : "border-emerald-500/50 bg-emerald-950/30 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border ${
                    result.verdict === "MALICIOUS"
                      ? "border-rose-500/40 bg-rose-500/20 text-rose-400"
                      : result.verdict === "HIGH_RISK"
                      ? "border-amber-500/40 bg-amber-500/20 text-amber-400"
                      : "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {result.verdict === "MALICIOUS" ? (
                    <ShieldAlert className="h-8 w-8 animate-pulse" />
                  ) : result.verdict === "HIGH_RISK" ? (
                    <AlertTriangle className="h-8 w-8 animate-pulse" />
                  ) : (
                    <ShieldCheck className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{result.caseNumber}</span>
                    <span className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-purple-400">
                      {result.threatDna}
                    </span>
                    {result.matchedCampaign && (
                      <span className="rounded bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                        {result.matchedCampaign}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-100 mt-1">
                    VERDICT: <span className={result.verdict === "MALICIOUS" ? "text-rose-400" : result.verdict === "HIGH_RISK" ? "text-amber-400" : "text-emerald-400"}>
                      {result.verdict}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="flex items-baseline gap-4 self-end md:self-center">
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-100 font-mono">
                    {result.threatScore}<span className="text-sm font-normal text-slate-400">/100</span>
                  </div>
                  <span className="text-xs text-slate-400 block">Threat Score</span>
                </div>
                <div className="text-right border-l border-slate-800 pl-4">
                  <div className="text-2xl font-bold text-slate-200 font-mono">
                    {result.confidence}%
                  </div>
                  <span className="text-xs text-slate-400 block">Confidence</span>
                </div>
              </div>
            </div>

            {/* Why? Breakdown Tagged Factors */}
            <div className="mt-4">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Why was this verdict reached? (Deterministic Evidence):
              </span>
              <div className="flex flex-wrap gap-2">
                {result.reasons?.map((r: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-200 shadow-sm"
                  >
                    <span className="font-mono font-bold text-rose-400">+{r.points}</span>
                    <span>{r.reason}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Defensive Actions */}
            {result.recommendedActions && result.recommendedActions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">Mandated Actions:</span>
                {result.recommendedActions.map((act: string, i: number) => (
                  <span key={i} className="rounded bg-slate-900/80 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                    • {act}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Global Geolocation & Routing Map */}
          <div className="space-y-2">
            <GeoMap
              coordinates={[
                {
                  ip: result.geolocation?.ip || "185.220.101.44",
                  country: result.geolocation?.countryName || "Germany",
                  city: result.geolocation?.city || "Frankfurt",
                  lat: result.geolocation?.latitude ?? 50.1109,
                  lon: result.geolocation?.longitude ?? 8.6821,
                  asn: result.geolocation?.asn || "AS200651",
                  org: result.geolocation?.asnOrg || "Flokinet",
                  type: "origin",
                },
              ]}
            />
          </div>

          {/* Section 3: Authentication Forensics Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">SPF Authentication</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    result.authentication?.spf?.status === "PASS"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {result.authentication?.spf?.status || "NONE"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                {result.authentication?.spf?.details || "Validated against domain TXT SPF policies."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">DKIM Cryptographic Signature</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    result.authentication?.dkim?.status === "PASS"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {result.authentication?.dkim?.status || "NONE"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                {result.authentication?.dkim?.details || "DKIM header cryptographic signature check."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">DMARC Alignment</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    result.authentication?.dmarc?.status === "PASS"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {result.authentication?.dmarc?.status || "FAIL"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                {result.authentication?.dmarc?.details || "RFC 7489 identifier alignment evaluated against From domain."}
              </p>
            </div>
          </div>

          {/* Section 4: AI Threat Intent & Social Engineering */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">AI Threat Intent & Social Engineering Classification</h3>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400 font-bold">
                INTENT: {result.aiAnalysis?.classification || "PHISHING"}
              </span>
            </div>

            <p className="text-xs text-slate-300">{result.aiAnalysis?.explanation}</p>

            {result.aiAnalysis?.indicators && result.aiAnalysis.indicators.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {result.aiAnalysis.indicators.map((ind: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                    <span className="text-cyan-400 font-bold block uppercase text-[10px]">{ind.type.replace(/_/g, " ")}</span>
                    <span className="text-slate-400 italic text-[11px] mt-0.5 block">&quot;{ind.evidence}&quot;</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Cytoscape.js Interactive Attack Graph */}
          {result.graphData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">Attack Graph (Cytoscape.js)</h3>
                </div>
                <span className="text-xs text-slate-400">Click any node to inspect raw entity metadata</span>
              </div>
              <AttackGraphView graphData={result.graphData} />
            </div>
          )}

          {/* Section 6: Evidence Chain of Custody & Report Download */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 font-mono text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cryptographic Evidence Custody Hashes:</span>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-cyan-400 font-bold">SHA256:</span>
                <span className="break-all">{result.email?.evidenceHashSha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}</span>
                <button
                  onClick={() => handleCopy(result.email?.evidenceHashSha256)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {copiedHash === result.email?.evidenceHashSha256 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/api/reports/${result.caseNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg"
              >
                <Download className="h-4 w-4" />
                <span>Export Forensic Dossier</span>
              </a>
            </div>
          </div>

          {/* Section 7: Embedded Investigator Copilot Q&A */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Ask AI Investigator Copilot (Grounded in this Case)</h3>
            </div>
            <CopilotChat caseId={result.caseId} />
          </div>
        </div>
      )}
    </div>
  );
}
