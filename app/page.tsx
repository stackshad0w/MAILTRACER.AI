"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Globe, 
  Link as LinkIcon, 
  Server, 
  Hash, 
  UserCheck, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { SYNTHETIC_DEMO_CASES } from "@/lib/seed-data";

type VerifyTab = "email" | "website" | "domain" | "ip" | "hash" | "sender";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<VerifyTab>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [rawEmail, setRawEmail] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [ipInput, setIpInput] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  // Direct results state
  const [quickResult, setQuickResult] = useState<any>(null);

  // Handle Email submission
  const handleVerifyEmail = async () => {
    if (!rawEmail.trim()) {
      setError("Please paste raw email headers/body or select a sample");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/verify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawEmail }),
      });
      const data = await res.json();
      if (data.success && data.caseNumber) {
        router.push(`/cases/${data.caseNumber}`);
      } else {
        setError(data.error || "Email verification failed");
      }
    } catch {
      setError("Network error connecting to verification engine");
    } finally {
      setLoading(false);
    }
  };

  // Handle Website scan
  const handleVerifyWebsite = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    setLoading(true);
    setQuickResult(null);
    try {
      const res = await fetch("/api/verify/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickResult({ type: "website", data: data.result });
      } else {
        setError(data.error || "Website verification failed");
      }
    } catch {
      setError("Failed to run website scan");
    } finally {
      setLoading(false);
    }
  };

  // Handle Domain scan
  const handleVerifyDomain = async () => {
    if (!domainInput.trim()) return;
    setError(null);
    setLoading(true);
    setQuickResult(null);
    try {
      const res = await fetch("/api/verify/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickResult({ type: "domain", data });
      } else {
        setError(data.error || "Domain verification failed");
      }
    } catch {
      setError("Failed to verify domain");
    } finally {
      setLoading(false);
    }
  };

  // Handle IP scan
  const handleVerifyIp = async () => {
    if (!ipInput.trim()) return;
    setError(null);
    setLoading(true);
    setQuickResult(null);
    try {
      const res = await fetch("/api/verify/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: ipInput }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickResult({ type: "ip", data });
      } else {
        setError(data.error || "IP verification failed");
      }
    } catch {
      setError("Failed to verify IP");
    } finally {
      setLoading(false);
    }
  };

  // Handle Hash scan
  const handleVerifyHash = async () => {
    if (!hashInput.trim()) return;
    setError(null);
    setLoading(true);
    setQuickResult(null);
    try {
      const res = await fetch("/api/verify/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: hashInput }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickResult({ type: "hash", data });
      } else {
        setError(data.error || "Hash verification failed");
      }
    } catch {
      setError("Failed to verify hash");
    } finally {
      setLoading(false);
    }
  };

  // Handle Sender scan
  const handleVerifySender = async () => {
    if (!senderEmail.trim()) return;
    setError(null);
    setLoading(true);
    setQuickResult(null);
    try {
      const res = await fetch("/api/verify/sender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: senderEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickResult({ type: "sender", data });
      } else {
        setError(data.error || "Sender verification failed");
      }
    } catch {
      setError("Failed to verify sender");
    } finally {
      setLoading(false);
    }
  };

  // Load sample into email box
  const loadDemoEmail = (index: number) => {
    const demo = SYNTHETIC_DEMO_CASES[index];
    const sample = `From: ${demo.email.fromName || "Sender"} <${demo.email.fromAddress}>
To: ${demo.email.toAddress}
Reply-To: ${demo.email.replyTo || demo.email.fromAddress}
Subject: ${demo.email.subject}
Date: ${new Date().toUTCString()}
Authentication-Results: spf=${demo.email.authResults.spf.status} (${demo.email.authResults.spf.details}); dkim=${demo.email.authResults.dkim.status}; dmarc=${demo.email.authResults.dmarc.status}

${demo.email.bodyText}`;
    setRawEmail(sample);
  };

  const tabs = [
    { id: "email", label: "Email Message", icon: Mail, desc: "EML or raw headers" },
    { id: "website", label: "Website URL", icon: Globe, desc: "SSRF-safe inspection" },
    { id: "domain", label: "Domain Intel", icon: Server, desc: "DNS & typosquatting" },
    { id: "ip", label: "IP Infrastructure", icon: LinkIcon, desc: "Geo & abuse lookup" },
    { id: "hash", label: "File Hash", icon: Hash, desc: "SHA256 / MD5 signatures" },
    { id: "sender", label: "Sender Identity", icon: UserCheck, desc: "SPF & DMARC alignment" },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <div className="text-center pt-6 pb-2 max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-400">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Multi-Signal Threat Intelligence & Digital Forensics</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
          Can this email or website <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            be trusted?
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          MailTracer.ai combines email headers, cryptographic authentication (SPF/DKIM/DMARC), 
          safe website scanning, domain typosquatting detection, Threat DNA, and Cytoscape.js attack graphs.
        </p>
      </div>

      {/* Main Verification Hub */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Verification Center
            </h2>
            <span className="text-[11px] font-mono text-slate-400">SELECT VERIFICATION MODE</span>
          </div>

          {/* Verification Tabs */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id as VerifyTab);
                    setError(null);
                    setQuickResult(null);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all border ${
                    active
                      ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      : "border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1.5" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Body */}
        <div className="mt-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. EMAIL VERIFICATION */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Paste raw RFC5322 email text or drag-and-drop an .eml file:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-amber-400">Load sample:</span>
                  <button
                    onClick={() => loadDemoEmail(0)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    Phishing Lure
                  </button>
                  <button
                    onClick={() => loadDemoEmail(1)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    BEC Wire Fraud
                  </button>
                  <button
                    onClick={() => loadDemoEmail(3)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    Benign
                  </button>
                </div>
              </div>

              <textarea
                value={rawEmail}
                onChange={(e) => setRawEmail(e.target.value)}
                placeholder="From: security@microsoft-verify-portal.net&#10;To: target@example.com&#10;Subject: Urgent Security Action Required&#10;&#10;Please verify your credentials..."
                rows={9}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />

              <button
                onClick={handleVerifyEmail}
                disabled={loading || !rawEmail.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing Full Forensic Pipeline...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    <span>Run Full Email Investigation</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* 2. WEBSITE VERIFICATION */}
          {activeTab === "website" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter any public URL. Protected by strict SSRF controls (blocks localhost, private networks, cloud metadata).
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/login"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleVerifyWebsite}
                  disabled={loading || !urlInput.trim()}
                  className="rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan Website"}
                </button>
              </div>
            </div>
          )}

          {/* 3. DOMAIN VERIFICATION */}
          {activeTab === "domain" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Check DNS resolution, MX records, lookalike / typosquatting brand imitation, and SPF records.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="microsoft-verify-portal.net"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleVerifyDomain}
                  disabled={loading || !domainInput.trim()}
                  className="rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Inspect Domain"}
                </button>
              </div>
            </div>
          )}

          {/* 4. IP VERIFICATION */}
          {activeTab === "ip" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Analyze IP geolocation, reverse DNS, hosting organization, and threat intelligence abuse records.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="185.220.101.44"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleVerifyIp}
                  disabled={loading || !ipInput.trim()}
                  className="rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trace IP"}
                </button>
              </div>
            </div>
          )}

          {/* 5. HASH VERIFICATION */}
          {activeTab === "hash" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Verify MD5, SHA1, or SHA256 file hashes against threat intelligence databases. (Unknown does not mean safe).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleVerifyHash}
                  disabled={loading || !hashInput.trim()}
                  className="rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup Hash"}
                </button>
              </div>
            </div>
          )}

          {/* 6. SENDER VERIFICATION */}
          {activeTab === "sender" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Verify sender address authenticity, lookalike brand impersonation, and domain DMARC policy.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="security-noreply@microsoft-verify-portal.net"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleVerifySender}
                  disabled={loading || !senderEmail.trim()}
                  className="rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Sender"}
                </button>
              </div>
            </div>
          )}

          {/* Quick inline result display */}
          {quickResult && (
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-cyan-400">
                    {quickResult.type} Verification Result
                  </span>
                  {quickResult.data.verdict && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        quickResult.data.verdict === "MALICIOUS"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : quickResult.data.verdict === "SUSPICIOUS"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {quickResult.data.verdict}
                    </span>
                  )}
                </div>
                {quickResult.data.riskScore !== undefined && (
                  <span className="text-xs text-slate-400">
                    Risk Score: <strong className="text-slate-100">{quickResult.data.riskScore}/100</strong>
                  </span>
                )}
              </div>

              <pre className="mt-3 max-h-60 overflow-y-auto rounded bg-slate-900/60 p-3 font-mono text-[11px] text-slate-300 border border-slate-800/80">
                {JSON.stringify(quickResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Synthetic Demo Scenarios Showcase */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-200">Synthetic Demonstration Investigations</h3>
            <p className="text-xs text-slate-400">Pre-analyzed threat scenarios demonstrating full multi-signal correlation.</p>
          </div>
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            DEMO / SYNTHETIC DATA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SYNTHETIC_DEMO_CASES.map((demo) => (
            <div
              key={demo.caseNumber}
              onClick={() => router.push(`/cases/${demo.caseNumber}`)}
              className="group cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/50 p-5 hover:border-cyan-500/40 hover:bg-slate-900 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-cyan-400">{demo.caseNumber}</span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                    demo.verdict === "MALICIOUS"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : demo.verdict === "HIGH_RISK"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {demo.verdict} ({demo.threatScore}/100)
                </span>
              </div>

              <h4 className="mt-2 text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {demo.title}
              </h4>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">{demo.description}</p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[11px] text-slate-500">
                <span className="font-mono text-purple-400">{demo.threatDna}</span>
                <span className="flex items-center gap-1 text-cyan-400 group-hover:underline">
                  Open Dossier <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
