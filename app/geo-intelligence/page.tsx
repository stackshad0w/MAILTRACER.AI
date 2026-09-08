import { db } from "@/lib/db";
import { Globe, AlertTriangle, ShieldCheck, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GeoIntelligencePage() {
  const cases = await db.case.findMany({
    include: {
      emails: true,
      threatScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
    take: 20,
  });

  const geoLocations = [
    { ip: "185.220.101.44", country: "Germany", city: "Frankfurt", asn: "AS200651", org: "Flokinet Iceland", count: 12, threat: "MALICIOUS" },
    { ip: "104.244.76.13", country: "Luxembourg", city: "Roost", asn: "AS53667", org: "FranTech Solutions", count: 8, threat: "HIGH_RISK" },
    { ip: "45.33.32.156", country: "United States", city: "Dallas", asn: "AS63949", org: "Linode LLC", count: 15, threat: "MALICIOUS" },
    { ip: "198.51.100.22", country: "United States", city: "San Jose", asn: "AS15169", org: "Google Cloud Infrastructure", count: 24, threat: "TRUSTED" },
    { ip: "93.184.216.34", country: "United States", city: "Norwell", asn: "AS15133", org: "Edgecast Inc.", count: 4, threat: "TRUSTED" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Infrastructure Geolocation & ASN Mapping</h1>
            <p className="text-xs text-slate-400">
              Observation of routing network topology, border gateway protocols, and autonomous system coordinates.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Alert per Section 21 & 59 */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-300">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <strong className="block font-bold text-amber-200 uppercase tracking-wide">
            Mandatory Cybersecurity Forensic Disclaimer:
          </strong>
          <p className="mt-0.5">
            IP geolocation represents observed routing infrastructure, proxies, and relays. It does NOT identify an attacker&apos;s physical location or geographic residence.
          </p>
        </div>
      </div>

      {/* Infrastructure Telemetry Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="border-b border-slate-800 px-5 py-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Observed Inbound Relay & Hosting Nodes
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 font-mono text-slate-400">
              <tr>
                <th className="px-5 py-3">IP ADDRESS</th>
                <th className="px-5 py-3">COUNTRY / CITY</th>
                <th className="px-5 py-3">AUTONOMOUS SYSTEM (ASN)</th>
                <th className="px-5 py-3">HOSTING ORG</th>
                <th className="px-5 py-3">PROFILE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {geoLocations.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-cyan-400">{g.ip}</td>
                  <td className="px-5 py-3 text-slate-200">
                    {g.country}, {g.city}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-400">{g.asn}</td>
                  <td className="px-5 py-3 text-slate-300">{g.org}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        g.threat === "MALICIOUS"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : g.threat === "HIGH_RISK"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {g.threat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
