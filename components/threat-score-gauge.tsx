"use client";

import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle } from "lucide-react";

interface ThreatScoreGaugeProps {
  score: number;
  verdict: string;
  confidence: number;
}

export function ThreatScoreGauge({ score, verdict, confidence }: ThreatScoreGaugeProps) {
  const getTheme = () => {
    switch (verdict) {
      case "MALICIOUS":
        return {
          textColor: "text-rose-400",
          bgColor: "bg-rose-500/10",
          borderColor: "border-rose-500/40",
          glowColor: "shadow-[0_0_25px_rgba(244,63,94,0.3)]",
          barColor: "bg-gradient-to-r from-rose-500 to-red-600",
          Icon: ShieldAlert,
        };
      case "HIGH_RISK":
        return {
          textColor: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/40",
          glowColor: "shadow-[0_0_25px_rgba(245,158,11,0.3)]",
          barColor: "bg-gradient-to-r from-amber-500 to-orange-600",
          Icon: AlertTriangle,
        };
      case "SUSPICIOUS":
        return {
          textColor: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/40",
          glowColor: "shadow-[0_0_25px_rgba(234,179,8,0.25)]",
          barColor: "bg-gradient-to-r from-yellow-400 to-amber-500",
          Icon: AlertTriangle,
        };
      case "LOW_RISK":
        return {
          textColor: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/40",
          glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
          barColor: "bg-gradient-to-r from-blue-400 to-cyan-500",
          Icon: ShieldCheck,
        };
      case "TRUSTED":
        return {
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/40",
          glowColor: "shadow-[0_0_25px_rgba(16,185,129,0.3)]",
          barColor: "bg-gradient-to-r from-emerald-400 to-teal-500",
          Icon: ShieldCheck,
        };
      default:
        return {
          textColor: "text-slate-400",
          bgColor: "bg-slate-800/40",
          borderColor: "border-slate-700",
          glowColor: "",
          barColor: "bg-slate-600",
          Icon: HelpCircle,
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.Icon;

  return (
    <div
      className={`rounded-xl border ${theme.borderColor} ${theme.bgColor} ${theme.glowColor} p-5 backdrop-blur-sm transition-all`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${theme.borderColor} ${theme.bgColor} ${theme.textColor}`}>
            <Icon className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">UNIFIED THREAT VERDICT</span>
            <h3 className={`text-2xl font-black tracking-tight ${theme.textColor}`}>
              {verdict.replace("_", " ")}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black text-slate-100">
            {score}<span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <div className="text-xs text-slate-400">
            Confidence: <span className="font-semibold text-slate-200">{confidence}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full ${theme.barColor} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-mono text-slate-500">
          <span>0 (CLEAN)</span>
          <span>40 (SUSPICIOUS)</span>
          <span>70 (HIGH RISK)</span>
          <span>100 (MALICIOUS)</span>
        </div>
      </div>
    </div>
  );
}
