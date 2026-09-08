"use client";

import { useState } from "react";
import { Bot, Send, User, Sparkles, ShieldAlert, CheckCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
}

export function CopilotChat({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello Analyst. I am your **MailTracer Copilot**, strictly grounded in the preserved forensic evidence for this case. Ask me why this message was flagged, check sender alignment, explore Threat DNA, or request an executive summary.",
      citations: ["Evidence Vault: Preserved RFC5322 Headers", "Verification Matrix"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Why did you assign this threat score?",
    "Is the sender identity verified or spoofed?",
    "Are there similar campaigns or Threat DNA matches?",
    "Generate an executive forensic summary.",
  ];

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userQ = questionText.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userQ }]);
    setLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, question: userQ }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer,
            citations: data.evidenceCitations,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error retrieving forensic evidence: ${data.error || "Unable to consult evidence vault"}`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Network connectivity timeout querying Copilot service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">AI Investigator Copilot</h4>
            <p className="text-[10px] text-slate-400">Evidence-Grounded RAG Reasoning Engine</p>
          </div>
        </div>
        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          STRICT GROUNDING: ON
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 shadow-md ${
                m.role === "user"
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-950/80 border border-slate-800 text-slate-200"
              }`}
            >
              <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                {m.content}
              </div>

              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                  <span className="font-semibold text-cyan-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-cyan-400" /> Evidence Citations:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.citations.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="rounded bg-slate-900 border border-slate-700/60 px-1.5 py-0.5 font-mono text-[9px] text-slate-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 text-xs text-cyan-400 items-center animate-pulse">
            <Bot className="h-4 w-4" />
            <span>Consulting case evidence vault and computing forensic reasoning...</span>
          </div>
        )}
      </div>

      {/* Suggested queries */}
      <div className="border-t border-slate-800/60 bg-slate-950/40 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">Suggested:</span>
          {suggestedQuestions.map((sq, sIdx) => (
            <button
              key={sIdx}
              onClick={() => handleSend(sq)}
              className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-0.5 text-[10px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors whitespace-nowrap"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-800 bg-slate-950 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot about sender authenticity, URLs, Threat DNA, or MITRE tactics..."
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center justify-center rounded-lg bg-cyan-500 px-3 py-2 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors font-medium"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
