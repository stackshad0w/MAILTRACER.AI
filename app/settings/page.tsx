import { Settings, ShieldCheck, Key, Database, Globe, EyeOff, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  const hasVirusTotal = Boolean(process.env.VIRUSTOTAL_API_KEY);
  const hasAbuseIpdb = Boolean(process.env.ABUSEIPDB_API_KEY);
  const hasIpinfo = Boolean(process.env.IPINFO_TOKEN);
  const isDemoMode = process.env.DEMO_MODE === "true";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Platform Settings & Security Policies</h1>
            <p className="text-xs text-slate-400">
              Configure threat intelligence feeds, AI processing mode, and SSRF defensive boundaries.
            </p>
          </div>
        </div>
      </div>

      {/* AI Processing Mode (Section 69 Privacy) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">AI Privacy & Processing Architecture</h3>
          </div>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
            {hasOpenAi ? "HYBRID NEURAL" : "DETERMINISTIC RULES"}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          In strict compliance with forensic privacy guidelines (Section 69), sensitive customer email text is only dispatched to external LLMs if explicit keys are configured. If no key is set, MailTracer.ai transparently falls back to our deterministic heuristic rules engine.
        </p>

        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex items-center justify-between text-xs">
          <span className="text-slate-300">Active AI Pipeline Status:</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {hasOpenAi ? "Active (gpt-4o-mini with prompt quarantine)" : "Deterministic Heuristics Fallback Active"}
          </span>
        </div>
      </div>

      {/* External Threat Intelligence Providers Status (Section 24) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">External Threat Intelligence Providers</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">HONEST TELEMETRY</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <span className="font-bold text-slate-200">VirusTotal API v3</span>
              <span className="text-slate-500 block text-[11px]">URL, Domain, File Hash & IP Multi-Engine Telemetry</span>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                hasVirusTotal ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
              }`}
            >
              {hasVirusTotal ? "Configured" : "Status: Not configured"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <span className="font-bold text-slate-200">AbuseIPDB API v2</span>
              <span className="text-slate-500 block text-[11px]">Crowdsourced IP abuse confidence scoring & blacklists</span>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                hasAbuseIpdb ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
              }`}
            >
              {hasAbuseIpdb ? "Configured" : "Status: Not configured"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <span className="font-bold text-slate-200">IPinfo Geolocation</span>
              <span className="text-slate-500 block text-[11px]">ASN routing, BGP prefixes, and network organization</span>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                hasIpinfo ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
              }`}
            >
              {hasIpinfo ? "Configured" : "Status: Not configured"}
            </span>
          </div>
        </div>
      </div>

      {/* SSRF Security Configuration (Section 44) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">SSRF & Network Boundary Protections</h3>
        </div>

        <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
          <li>Strict rejection of loopback addresses: <code className="text-cyan-400 font-mono">127.0.0.0/8, ::1, 0.0.0.0</code></li>
          <li>RFC 1918 private ranges blocked: <code className="text-cyan-400 font-mono">10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16</code></li>
          <li>Cloud metadata endpoints blocked: <code className="text-cyan-400 font-mono">169.254.169.254</code> (AWS/GCP/Azure)</li>
          <li>DNS pre-resolution validation enforced prior to any HTTP connection initiation</li>
          <li>Response payload buffer capped at 512KB to protect serverless memory allocations</li>
        </ul>
      </div>
    </div>
  );
}
