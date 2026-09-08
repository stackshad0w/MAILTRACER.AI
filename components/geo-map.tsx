"use client";

import { useMemo } from "react";
import { Globe, Radio, ShieldAlert, AlertTriangle } from "lucide-react";

export interface GeoCoordinate {
  ip: string;
  country: string;
  city?: string;
  lat: number;
  lon: number;
  asn?: string;
  org?: string;
  type: "origin" | "relay" | "destination";
}

interface GeoMapProps {
  coordinates: GeoCoordinate[];
}

export function GeoMap({ coordinates }: GeoMapProps) {
  // Convert lat/lon to SVG coordinates (800x400 viewbox)
  const project = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x: Math.max(20, Math.min(780, x)), y: Math.max(20, Math.min(380, y)) };
  };

  const origin = coordinates.find((c) => c.type === "origin") || coordinates[0];
  const destination = coordinates.find((c) => c.type === "destination") || {
    ip: "198.51.100.22",
    country: "United States",
    city: "San Jose, CA",
    lat: 37.3382,
    lon: -121.8863,
    asn: "AS15169",
    org: "Recipient Mail Gateway",
    type: "destination" as const,
  };

  const originPoint = origin ? project(origin.lat, origin.lon) : { x: 450, y: 150 };
  const destPoint = project(destination.lat, destination.lon);

  // Curved hop path
  const midX = (originPoint.x + destPoint.x) / 2;
  const midY = Math.min(originPoint.y, destPoint.y) - 60;
  const curvePath = `M ${originPoint.x} ${originPoint.y} Q ${midX} ${midY} ${destPoint.x} ${destPoint.y}`;

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
      {/* Map Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Global Geolocation & Routing Trajectory
          </h4>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          BGP TRACE ACTIVE
        </span>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative h-64 sm:h-80 w-full bg-[#070b14]">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#1e293b" />
            </pattern>
            {/* Gradient Line */}
            <linearGradient id="hopGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="800" height="400" fill="url(#grid)" />

          {/* Simplified World Continent Shapes */}
          <g fill="#0f172a" stroke="#1e293b" strokeWidth="0.8" opacity="0.85">
            {/* North America */}
            <path d="M 120 70 L 260 60 L 290 120 L 240 180 L 190 190 L 160 220 L 140 180 L 100 130 Z" />
            {/* South America */}
            <path d="M 230 220 L 290 240 L 310 320 L 270 380 L 240 340 L 220 270 Z" />
            {/* Europe */}
            <path d="M 390 70 L 480 60 L 490 110 L 450 140 L 390 130 L 380 90 Z" />
            {/* Africa */}
            <path d="M 390 150 L 480 160 L 500 240 L 470 330 L 430 330 L 380 230 L 370 170 Z" />
            {/* Asia */}
            <path d="M 490 60 L 680 50 L 720 140 L 650 220 L 560 210 L 520 140 L 480 120 Z" />
            {/* Australia */}
            <path d="M 640 270 L 730 260 L 740 330 L 660 340 Z" />
          </g>

          {/* Connecting Hop Trajectory */}
          <path
            d={curvePath}
            fill="none"
            stroke="url(#hopGradient)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Origin Marker (Threat Source) */}
          <g transform={`translate(${originPoint.x}, ${originPoint.y})`}>
            <circle r="16" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.4" className="animate-ping" />
            <circle r="8" fill="#f43f5e" opacity="0.2" />
            <circle r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            <rect x="-45" y="-28" width="90" height="16" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="0.8" />
            <text x="0" y="-17" fill="#fda4af" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ORIGIN: {origin.country}
            </text>
          </g>

          {/* Destination Marker (Enterprise Mailbox) */}
          <g transform={`translate(${destPoint.x}, ${destPoint.y})`}>
            <circle r="12" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
            <circle r="6" fill="#06b6d4" opacity="0.2" />
            <circle r="4" fill="#06b6d4" stroke="#fff" strokeWidth="1.5" />
            <rect x="-40" y="-28" width="80" height="16" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="0.8" />
            <text x="0" y="-17" fill="#67e8f9" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              TARGET GATEWAY
            </text>
          </g>
        </svg>

        {/* Telemetry Overlay Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 text-[11px] shadow-lg">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-400">Transmitting Host:</span>
            <span className="font-mono font-bold text-slate-100">{origin.ip}</span>
            <span className="text-rose-400 font-semibold">({origin.city || origin.country})</span>
            <span className="text-slate-500 font-mono text-[10px]">{origin.asn || "AS200651"}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 text-[11px] shadow-lg">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Recipient Route:</span>
            <span className="font-mono text-cyan-300 font-bold">{destination.city || destination.country}</span>
            <span className="text-slate-500 font-mono text-[10px]">{destination.asn}</span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Footer */}
      <div className="border-t border-slate-800/80 bg-slate-950 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span>⚠ Geolocation coordinates represent observed BGP network routing and do not pinpoint physical attacker residence.</span>
        <span className="font-mono text-slate-500">PROJECTION: EQUIRECTANGULAR WGS84</span>
      </div>
    </div>
  );
}
