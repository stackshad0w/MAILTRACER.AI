import { db } from "@/lib/db";
import { AttackGraphView } from "@/components/attack-graph-view";
import { AttackGraphData } from "@/lib/types";
import { Network } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GlobalAttackGraphPage() {
  const nodes = await db.graphNode.findMany({ take: 50 });
  const edges = await db.graphEdge.findMany({ take: 50 });

  const graphData: AttackGraphData = {
    nodes: nodes.map((n) => ({
      id: n.nodeId,
      label: n.label,
      type: n.type as any,
      threatLevel: n.threatLevel as any,
    })),
    edges: edges.map((e) => ({
      source: e.sourceId,
      target: e.targetId,
      label: e.label,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Interactive Attack Graph Explorer</h1>
            <p className="text-xs text-slate-400">
              Visual entity graph powered by Cytoscape.js. Trace relationships between emails, sender identities, lookalike domains, IPs, payload hashes, and Threat DNA clusters.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl">
        <AttackGraphView graphData={graphData} />
      </div>
    </div>
  );
}
