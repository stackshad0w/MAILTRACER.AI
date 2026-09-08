"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { AttackGraphData } from "@/lib/types";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X, Info } from "lucide-react";

interface AttackGraphViewProps {
  graphData: AttackGraphData;
}

export function AttackGraphView({ graphData }: AttackGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; type: string; threatLevel: string; details?: any } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert graphData to Cytoscape elements
    const elements = [
      ...graphData.nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          threatLevel: n.threatLevel,
          details: n.details,
        },
      })),
      ...graphData.edges.map((e, idx) => ({
        data: {
          id: `edge-${idx}`,
          source: e.source,
          target: e.target,
          label: e.label,
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            color: "#f8fafc",
            "font-size": "10px",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "background-color": "#0284c7",
            width: 36,
            height: 36,
            "border-width": 2,
            "border-color": "#38bdf8",
          },
        },
        {
          selector: 'node[threatLevel = "DANGER"]',
          style: {
            "background-color": "#e11d48",
            "border-color": "#fda4af",
            width: 42,
            height: 42,
          },
        },
        {
          selector: 'node[threatLevel = "WARNING"]',
          style: {
            "background-color": "#d97706",
            "border-color": "#fde68a",
            width: 38,
            height: 38,
          },
        },
        {
          selector: 'node[threatLevel = "SAFE"]',
          style: {
            "background-color": "#059669",
            "border-color": "#6ee7b7",
            width: 36,
            height: 36,
          },
        },
        {
          selector: 'node[type = "DNA"]',
          style: {
            shape: "hexagon",
            "background-color": "#7c3aed",
            "border-color": "#c4b5fd",
            width: 44,
            height: 44,
          },
        },
        {
          selector: 'node[type = "CAMPAIGN"]',
          style: {
            shape: "diamond",
            "background-color": "#dc2626",
            "border-color": "#fca5a5",
            width: 50,
            height: 50,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#334155",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "8px",
            color: "#94a3b8",
            "text-rotation": "autorotate",
            "text-margin-y": -6,
          },
        },
      ],
      layout: {
        name: "breadthfirst",
        directed: true,
        padding: 40,
        spacingFactor: 1.4,
      },
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.id(),
        label: node.data("label"),
        type: node.data("type"),
        threatLevel: node.data("threatLevel"),
        details: node.data("details"),
      });
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleReset = () => cyRef.current?.fit(undefined, 30);

  return (
    <div className="relative h-[540px] w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 backdrop-blur px-2 py-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset View"
          className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/90 backdrop-blur px-3 py-1.5 text-[11px] text-slate-300 shadow-lg">
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span>Malicious / High Threat</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span>Suspicious</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
          <span>Infrastructure</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          <span>Threat DNA</span>
        </div>
      </div>

      {/* Cytoscape Container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Node Inspector Modal/Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-20 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl max-w-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-400 uppercase">
                {selectedNode.type}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  selectedNode.threatLevel === "DANGER"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : selectedNode.threatLevel === "WARNING"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                }`}
              >
                {selectedNode.threatLevel}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h5 className="mt-2 text-sm font-bold text-slate-100 break-all">{selectedNode.label}</h5>
          {selectedNode.details && (
            <pre className="mt-2 rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-400 overflow-x-auto">
              {JSON.stringify(selectedNode.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
