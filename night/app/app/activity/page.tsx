"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { useStoredAgent } from "@/lib/agents";
import { useConnectedSources, type ConnectedSource } from "@/lib/kg/storage";
import { useLiveGraph } from "@/lib/kg/live";

const SUGGESTIONS = [
  "What invoices are due this month?",
  "Which vendors have the most activity?",
  "Summarise my upcoming meetings.",
  "Are there any failed charges I should know about?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: string;
  nodeIds?: string[];
}

function mkId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SOURCE_LABELS: Record<ConnectedSource, string> = {
  gmail: "Gmail",
  calendar: "Calendar",
  finance: "Finance",
  drive: "Drive",
};

export default function ChatPage() {
  const agent = useStoredAgent();
  const connected = useConnectedSources();
  const liveGraph = useLiveGraph();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const nodeCountBySource = (src: ConnectedSource) =>
    liveGraph.nodes.filter((n) => n.source === src && !n.private).length;

  const totalKgNodes = liveGraph.nodes.filter((n) => !n.private).length;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");

    const userMsg: Message = { id: mkId(), role: "user", content: trimmed };
    const placeholder: Message = {
      id: mkId(),
      role: "assistant",
      content: "thinking...",
      pending: true,
    };
    const history = messages
      .filter((m) => !m.pending && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, placeholder]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          agentId: agent?.agentId,
          connectedSources: [...connected],
          liveNodes: liveGraph.nodes.filter((n) => !n.private),
          liveEdges: liveGraph.edges,
          history,
        }),
      });
      const data = (await res.json()) as { answer: string; nodeIds?: string[] };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id
            ? { ...m, content: data.answer, pending: false, nodeIds: data.nodeIds }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id
            ? { ...m, content: "", pending: false, error: (err as Error).message }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <AppShell noPadding>
      <div className="flex h-[calc(100vh-0px)] flex-col md:flex-row">
        <aside className="hidden w-72 shrink-0 flex-col gap-0 border-r border-foreground/12 bg-surface/40 md:flex">
          <div className="p-5 border-b border-foreground/12">
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45 mb-3">
              Active agent
            </div>
            {agent ? (
              <div>
                <div className="text-sm font-medium text-foreground">{agent.agentLabel}</div>
                <div className="mt-0.5 font-mono text-[10px] text-foreground/45 break-all">
                  {agent.policyHash.slice(0, 20)}…
                </div>
                <div
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] ${
                    agent.revokedAt === null
                      ? "bg-emerald-700/[0.08] text-emerald-700"
                      : "bg-red-700/[0.08] text-red-700"
                  }`}
                >
                  <span className="inline-block h-1 w-1 rounded-full bg-current" />
                  {agent.revokedAt === null ? "active" : "revoked"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-foreground/45">
                No agent registered. Go to Agents to create one.
              </div>
            )}
          </div>

          <div className="p-5 border-b border-foreground/12">
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45 mb-3">
              Connected sources
            </div>
            {connected.size === 0 ? (
              <div className="text-sm text-foreground/45">
                No sources connected. Go to Sources.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {(["gmail", "calendar", "finance", "drive"] as ConnectedSource[])
                  .filter((s) => connected.has(s))
                  .map((s) => (
                    <li key={s} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        <span className="font-mono text-xs text-foreground/75">
                          {SOURCE_LABELS[s]}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-foreground/45">
                        {nodeCountBySource(s)} nodes
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45 mb-3">
              Knowledge graph
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-foreground/12 bg-surface px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/40">Nodes</div>
                <div className="mt-0.5 font-serif text-xl text-foreground">{totalKgNodes}</div>
              </div>
              <div className="rounded-xl border border-foreground/12 bg-surface px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-widest text-foreground/40">Edges</div>
                <div className="mt-0.5 font-serif text-xl text-foreground">{liveGraph.edges.length}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-foreground/12 px-5 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Chat
            </div>
            <div className="mt-0.5 font-serif text-lg text-foreground">
              Ask your knowledge graph.
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-start gap-3 pt-4">
                <div className="font-mono text-xs text-foreground/45 mb-2">
                  Suggested questions
                </div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="max-w-sm rounded-xl border border-foreground/15 bg-surface px-4 py-2.5 text-left text-sm text-foreground/75 hover:text-foreground hover:bg-surface-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-foreground text-background"
                          : m.error
                          ? "border border-red-700/30 bg-red-700/[0.06] text-red-700"
                          : "border border-foreground/12 bg-surface text-foreground"
                      }`}
                    >
                      {m.pending ? (
                        <span className="font-mono text-foreground/45">{m.content}</span>
                      ) : m.error ? (
                        <span>Error: {m.error}</span>
                      ) : (
                        <>
                          <div>{m.content}</div>
                          {m.nodeIds && m.nodeIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {m.nodeIds.slice(0, 4).map((id) => (
                                <span
                                  key={id}
                                  className="rounded-md border border-foreground/15 bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-foreground/50"
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-foreground/12 p-4">
            <div className="flex items-end gap-3">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  connected.size === 0
                    ? "Connect a source first…"
                    : "Ask about your data… (Enter to send)"
                }
                disabled={sending}
                className="flex-1 resize-none rounded-xl border border-foreground/20 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 focus:border-foreground/50 focus:outline-none disabled:opacity-50"
                style={{ maxHeight: "160px", overflowY: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 160) + "px";
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-xl bg-foreground px-4 py-3 font-mono text-xs uppercase tracking-widest text-background disabled:opacity-40 transition-opacity"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
