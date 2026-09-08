"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Radio, ShieldAlert, Crosshair, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCoord, setActiveCoord] = useState<GeoCoordinate | null>(null);

  // Normalized coordinates with fallback if empty
  const activeCoordinates: GeoCoordinate[] = coordinates && coordinates.length > 0 ? coordinates : [
    {
      ip: "185.220.101.44",
      country: "Germany",
      city: "Frankfurt",
      lat: 50.1109,
      lon: 8.6821,
      asn: "AS200651",
      org: "Flokinet Iceland / Tor Exit",
      type: "origin",
    },
    {
      ip: "198.51.100.22",
      country: "United States",
      city: "San Jose, CA",
      lat: 37.3382,
      lon: -121.8863,
      asn: "AS15169",
      org: "Enterprise Perimeter MX Gateway",
      type: "destination",
    },
  ];

  const origin = activeCoordinates.find((c) => c.type === "origin") || activeCoordinates[0];

  useEffect(() => {
    let isMounted = true;

    async function initLeafletMap() {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapContainerRef.current) return;

        // Create Leaflet Map Instance
        const map = L.map(mapContainerRef.current, {
          center: [origin.lat, origin.lon],
          zoom: 3,
          zoomControl: false,
          scrollWheelZoom: true,
          attributionControl: true,
        });

        // Add CartoDB Dark Matter Cyber SOC Tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        // Add Custom Zoom Control to top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        const latlngs: [number, number][] = [];

        // Plot Each Coordinate Hop
        activeCoordinates.forEach((coord, idx) => {
          const isOrigin = coord.type === "origin";
          const isRelay = coord.type === "relay";
          const isDest = coord.type === "destination";

          const ringColor = isOrigin ? "#f43f5e" : isRelay ? "#f59e0b" : "#06b6d4";
          const pulseClass = isOrigin ? "animate-ping" : "";

          // Custom HTML Radar Pin
          const customIcon = L.divIcon({
            className: "soc-geo-marker",
            html: `
              <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
                <div class="${pulseClass}" style="position: absolute; width: 26px; height: 26px; border-radius: 9999px; background-color: ${ringColor}; opacity: 0.35;"></div>
                <div style="position: absolute; width: 14px; height: 14px; border-radius: 9999px; background-color: ${ringColor}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${ringColor};"></div>
                <div style="position: absolute; top: -18px; white-space: nowrap; font-family: monospace; font-size: 9px; font-weight: 700; color: ${ringColor}; background: rgba(15, 23, 42, 0.9); border: 1px solid ${ringColor}60; padding: 1px 4px; border-radius: 3px;">
                  ${isOrigin ? "ORIGIN" : isRelay ? "WEB SERVER" : "GATEWAY"}
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([coord.lat, coord.lon], { icon: customIcon }).addTo(map);

          // Rich SOC Telemetry Popup
          const popupHtml = `
            <div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
              <div style="color: ${ringColor}; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 3px; margin-bottom: 4px;">
                [${isOrigin ? "THREAT ORIGIN" : isRelay ? "TARGET WEB HOST" : "RECIPIENT GATEWAY"}]
              </div>
              <div><strong style="color:#94a3b8;">IP:</strong> <span style="color:#f1f5f9; font-weight:bold;">${coord.ip}</span></div>
              <div><strong style="color:#94a3b8;">Location:</strong> <span style="color:#cbd5e1;">${coord.city ? coord.city + ", " : ""}${coord.country}</span></div>
              <div><strong style="color:#94a3b8;">Coordinates:</strong> <span style="color:#38bdf8;">${coord.lat.toFixed(4)}°, ${coord.lon.toFixed(4)}°</span></div>
              <div><strong style="color:#94a3b8;">ASN / Org:</strong> <span style="color:#a855f7;">${coord.asn || "Unknown"} · ${coord.org || "Unknown Provider"}</span></div>
            </div>
          `;

          marker.bindPopup(popupHtml);
          latlngs.push([coord.lat, coord.lon]);

          if (idx === 0) {
            setActiveCoord(coord);
          }
        });

        // Draw Hop Trajectory Polyline if multiple coordinates
        if (latlngs.length >= 2) {
          L.polyline(latlngs, {
            color: "#06b6d4",
            weight: 2.5,
            dashArray: "6, 8",
            opacity: 0.85,
          }).addTo(map);

          // Fit all coordinates neatly in the viewport
          const bounds = L.latLngBounds(latlngs);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
        }

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to load interactive Leaflet map:", err);
      }
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates]);

  const fitAllHops = () => {
    if (!mapInstanceRef.current || activeCoordinates.length === 0) return;
    try {
      const latlngs = activeCoordinates.map((c) => [c.lat, c.lon]);
      mapInstanceRef.current.fitBounds(latlngs, { padding: [40, 40], maxZoom: 6 });
    } catch {}
  };

  const focusOrigin = () => {
    if (!mapInstanceRef.current || !origin) return;
    try {
      mapInstanceRef.current.setView([origin.lat, origin.lon], 5);
    } catch {}
  };

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
      {/* Map Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: "16s" }} />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live Global Geolocation & Routing Trajectory
          </h4>
          <span className="hidden sm:inline-block rounded bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-mono text-cyan-400">
            OPENSTREETMAP / CARTO SOC TILES
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={focusOrigin}
            title="Focus on threat origin"
            className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-mono text-slate-300 transition-colors cursor-pointer"
          >
            <Crosshair className="h-3 w-3 text-rose-400" />
            <span>FOCUS ORIGIN</span>
          </button>
          <button
            onClick={fitAllHops}
            title="Fit all routing hops into view"
            className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] font-mono text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3 text-cyan-400" />
            <span>FIT ALL HOPS</span>
          </button>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE BGP
          </span>
        </div>
      </div>

      {/* Leaflet Map DOM Canvas */}
      <div className="relative h-72 sm:h-96 w-full bg-[#070b14]">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Real-time Telemetry Overlay Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 text-[11px] shadow-lg backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-400">Transmitting Host:</span>
            <span className="font-mono font-bold text-slate-100">{origin.ip}</span>
            <span className="text-rose-400 font-semibold">({origin.city || origin.country})</span>
            <span className="text-slate-500 font-mono text-[10px]">{origin.asn || "AS200651"}</span>
          </div>

          {activeCoordinates.length > 1 && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 text-[11px] shadow-lg backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-slate-400">Destination Hop:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {activeCoordinates[activeCoordinates.length - 1].city || activeCoordinates[activeCoordinates.length - 1].country}
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                {activeCoordinates[activeCoordinates.length - 1].asn}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Forensic Legal Disclaimer Footer */}
      <div className="border-t border-slate-800/80 bg-slate-950 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span>⚠ Real-time geolocation coordinates represent observed BGP network routing and do not pinpoint physical attacker residence.</span>
        <span className="font-mono text-slate-500">PROJECTION: MERCATOR (EPSG:3857)</span>
      </div>
    </div>
  );
}
