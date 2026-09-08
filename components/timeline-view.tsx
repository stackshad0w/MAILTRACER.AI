"use client";

import { Clock, AlertTriangle, ArrowDown } from "lucide-react";

interface TimelineItem {
  id: string;
  timestamp: string | Date;
  title: string;
  category: string;
  description: string;
  isWarning?: boolean;
}

export function TimelineView({ events }: { events: TimelineItem[] }) {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {events.map((ev, idx) => (
        <div key={ev.id || idx} className="relative group">
          {/* Beacon point */}
          <div
            className={`absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border ${
              ev.isWarning
                ? "border-rose-500/50 bg-rose-950 text-rose-400"
                : "border-cyan-500/50 bg-cyan-950 text-cyan-400"
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${ev.isWarning ? "bg-rose-400" : "bg-cyan-400"}`} />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-200">{ev.title}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 uppercase">
                  {ev.category}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{ev.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
