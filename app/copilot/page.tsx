import { db } from "@/lib/db";
import { CopilotChat } from "@/components/copilot-chat";
import { Bot, FolderArchive } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CopilotWorkspacePage() {
  const cases = await db.case.findMany({
    take: 1,
    orderBy: { createdAt: "desc" },
  });

  const activeCase = cases[0];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">AI Investigator Copilot Workspace</h1>
            <p className="text-xs text-slate-400">
              Interactive cyber intelligence dialogue strictly grounded in preserved case records with zero hallucination.
            </p>
          </div>
        </div>
      </div>

      {activeCase ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Currently inspecting active case:</span>
            <span className="font-mono font-bold text-cyan-400">{activeCase.caseNumber}</span>
            <span className="text-slate-300 font-semibold">— {activeCase.title}</span>
          </div>
          <CopilotChat caseId={activeCase.id} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-400">
          No cases currently ingested. Please submit an email or run a demo scenario from the homepage.
        </div>
      )}
    </div>
  );
}
