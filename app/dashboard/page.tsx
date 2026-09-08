import Link from "next/link";
import { db } from "@/lib/db";
import { 
  ShieldAlert, 
  Mail, 
  AlertTriangle, 
  Layers, 
  FolderArchive, 
  Activity, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  Dna
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const totalCases = await db.case.count();
  const totalEmails = await db.email.count();
  const criticalCases = await db.case.count({ where: { priority: "CRITICAL" } });
  const highCases = await db.case.count({ where: { priority: "HIGH" } });
  const campaignsCount = await db.campaign.count();
  const evidenceCount = await db.evidence.count();

  const recentCases = await db.case.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      threatScores: { take: 1, orderBy: { createdAt: "desc" } },
      threatDNAs: { take: 1 },
      emails: { select: { subject: true, fromAddress: true } },
    },
  });

  const campaigns = await db.campaign.findMany({
    take: 4,
    orderBy: { severity: "desc" },
    include: {
      threatDNAs: { select: { dnaCode: true } },
      members: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Security Operations Center (SOC)</h1>
            <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-mono text-cyan-400">
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global email threat monitoring, real-time campaign clustering, and autonomous forensic verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>New Verification</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase">TOTAL CASES</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100">{totalCases}</span>
            <FolderArchive className="h-4 w-4 text-cyan-400" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase">EMAILS PARSED</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100">{totalEmails}</span>
            <Mail className="h-4 w-4 text-blue-400" />
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <span className="text-[10px] font-mono text-rose-400 uppercase">CRITICAL THREATS</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400">{criticalCases}</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <span className="text-[10px] font-mono text-amber-400 uppercase">HIGH RISK INCIDENTS</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">{highCases}</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
          <span className="text-[10px] font-mono text-purple-400 uppercase">ACTIVE CAMPAIGNS</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-400">{campaignsCount}</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase">PRESERVED EVIDENCE</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{evidenceCount}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Investigations & Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Live Investigation Feed</h3>
            </div>
            <Link href="/cases" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All Cases <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentCases.map((rc) => {
              const score = rc.threatScores[0]?.score ?? 50;
              const verdict = rc.threatScores[0]?.verdict || "INCONCLUSIVE";
              const isDanger = verdict === "MALICIOUS" || verdict === "HIGH_RISK";

              return (
                <div key={rc.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cases/${rc.caseNumber}`}
                        className="font-mono text-xs font-semibold text-cyan-400 hover:underline"
                      >
                        {rc.caseNumber}
                      </Link>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          isDanger
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {verdict}
                      </span>
                      {rc.isDemo && (
                        <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[9px] text-amber-400">
                          DEMO
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1 text-xs font-medium text-slate-200 truncate">{rc.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      From: {rc.emails[0]?.fromAddress || "Unknown"}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-black text-slate-100">
                      {score}<span className="text-[10px] text-slate-500">/100</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(rc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Correlated Campaigns</h3>
            </div>
            <Link href="/campaigns" className="text-xs text-purple-400 hover:underline">
              All Clusters
            </Link>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div key={camp.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{camp.campaignName}</span>
                  <span className="rounded bg-rose-500/20 text-rose-400 px-1.5 py-0.5 text-[10px] font-bold">
                    {camp.severity}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{camp.description}</p>
                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Actor: {camp.threatActor || "Unknown"}</span>
                  <span className="text-purple-400 font-semibold">{camp.threatDNAs.length} DNA Matches</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
