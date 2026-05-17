"use client";

import { AppShell } from "@/components/app/AppShell";
import { useStoredAgent, useStoredQueries } from "@/lib/agents";
import { getNode } from "@/lib/kg/seed";

interface AuditEvent {
  kind: "register" | "policy" | "query" | "rejection" | "revoke";
  ts: number;
  title: string;
  body: string;
  meta?: Array<{ label: string; value: string }>;
  subgraph?: { nodes: string[]; edges: string[] };
  abortReason?: string | null;
}

export default function AuditPage() {
  const agent = useStoredAgent();
  const queries = useStoredQueries();

  const events: AuditEvent[] = [];
  if (agent) {
    events.push({
      kind: "register",
      ts: agent.registeredAt,
      title: "Agent registered on Midnight",
      body: `${agent.agentLabel} · owner committed`,
      meta: [
        { label: "agent id",         value: agent.agentId },
        { label: "register tx",      value: agent.registerTxHash ?? "—" },
      ],
    });
    events.push({
      kind: "policy",
      ts: agent.registeredAt,
      title: "Typed-graph scope bound to agent",
      body: agent.policy.kgScope
        ? `nodes [${agent.policy.kgScope.nodes.join(", ")}] · depth ${agent.policy.kgScope.maxDepth} · max ${agent.policy.maxQueries} queries`
        : `${agent.policy.scopes.length} scope${agent.policy.scopes.length === 1 ? "" : "s"} · max ${agent.policy.maxQueries} queries`,
      meta: [
        { label: "policy hash", value: agent.policyHash },
        { label: "scope hash",  value: agent.scopeHash ?? "—" },
        { label: "expiry",      value: new Date(agent.policy.expiryMs).toISOString() },
      ],
    });
    if (agent.revokedAt !== null) {
      events.push({
        kind: "revoke",
        ts: agent.revokedAt,
        title: "Agent revoked on chain",
        body: "Authorization checks now fail for this agent id",
        meta: [{ label: "agent id", value: agent.agentId }],
      });
    }
  }
  for (const q of queries) {
    events.push({
      kind: q.allowed ? "query" : "rejection",
      ts: q.ts,
      title: q.allowed ? "Query receipt logged" : "Out-of-scope traversal blocked",
      body: q.queryLabel,
      meta: [
        { label: "query hash",        value: q.queryHash },
        { label: "result commitment", value: q.resultCommitment },
        { label: "tx",                value: q.txHash ?? "—" },
      ],
      subgraph: q.visitedNodeIds && q.visitedEdgeIds
        ? { nodes: q.visitedNodeIds, edges: q.visitedEdgeIds }
        : undefined,
      abortReason: q.abortReason ?? null,
    });
  }
  events.sort((a, b) => b.ts - a.ts);

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Audit log
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Every receipt.{" "}
          <span className="text-foreground/55">In one place.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Agent registrations, scope commitments, traversal receipts and
          revocations. Each query carries the typed subgraph it visited — the
          provenance trail you can show a regulator without leaking what the
          agent actually saw.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Agents"      value={agent ? "1" : "0"} />
        <Stat label="Queries"     value={String(queries.filter((q) => q.allowed).length)} />
        <Stat label="Rejections"  value={String(queries.filter((q) => !q.allowed).length)} />
        <Stat label="Revoked"     value={agent?.revokedAt ? "1" : "0"} />
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-foreground/15 bg-surface p-6 font-mono text-sm text-foreground/55">
          No events yet. Register an agent on the Agents page to start the trail.
        </div>
      ) : (
        <ol className="space-y-3">
          {events.map((e, i) => (
            <li key={i} className="rounded-2xl border border-foreground/15 bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/55">
                  {kindLabel(e.kind)}
                </div>
                <div className="font-mono text-[10px] text-foreground/45">
                  {new Date(e.ts).toLocaleString()}
                </div>
              </div>
              <div className="mt-1.5 text-base font-medium text-foreground">{e.title}</div>
              <div className="mt-1 text-sm text-foreground/70">{e.body}</div>
              {e.abortReason && (
                <div className="mt-2 rounded-md border border-[#a4262c]/40 bg-[#a4262c]/[0.06] px-3 py-2 font-mono text-[11px] text-[#a4262c]">
                  TEE rejected: {e.abortReason}
                </div>
              )}
              {e.meta && e.meta.length > 0 && (
                <dl className="mt-3 grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
                  {e.meta.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-md border border-foreground/10 bg-surface-2 px-2.5 py-1.5"
                    >
                      <div className="text-[10px] uppercase tracking-widest text-foreground/45">
                        {m.label}
                      </div>
                      <div className="truncate text-foreground/85">{m.value}</div>
                    </div>
                  ))}
                </dl>
              )}
              {e.subgraph && e.subgraph.nodes.length > 0 && (
                <div className="mt-3 rounded-md border border-foreground/10 bg-surface-2 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45">
                    Visited subgraph
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px]">
                    {e.subgraph.nodes.map((id) => {
                      const node = getNode(id);
                      return (
                        <span
                          key={id}
                          className="rounded border border-foreground/20 bg-surface px-1.5 py-0.5 text-foreground/85"
                          title={node?.label}
                        >
                          {node ? `${node.type}:${node.label}` : id}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] text-foreground/45">
                    {e.subgraph.nodes.length} nodes · {e.subgraph.edges.length} edges
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/15 bg-surface px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/55">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl text-foreground">{value}</div>
    </div>
  );
}

function kindLabel(k: AuditEvent["kind"]): string {
  switch (k) {
    case "register":  return "AGENT REGISTER";
    case "policy":    return "POLICY";
    case "query":     return "QUERY RECEIPT";
    case "rejection": return "REJECTED";
    case "revoke":    return "REVOKE";
  }
}
