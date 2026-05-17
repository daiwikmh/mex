"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { readAgent, type AgentState } from "@/lib/agents";

export default function PoliciesPage() {
  const [agent, setAgent] = useState<AgentState | null>(null);

  useEffect(() => {
    setAgent(readAgent());
    const refresh = () => setAgent(readAgent());
    window.addEventListener("nocturne:agent-change", refresh);
    return () => window.removeEventListener("nocturne:agent-change", refresh);
  }, []);

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Policies
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Scope, expiry, ceiling.{" "}
          <span className="text-foreground/55">Signed on chain.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          The complete bound applied to your active agent. Adjusting the
          policy requires a new signature and a new commitment — the previous
          policy hash stays in the audit trail forever.
        </p>
      </header>

      {agent === null ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          <PolicyHeader agent={agent} />
          <ScopeList agent={agent} />
          <PolicyMeta agent={agent} />
        </div>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-foreground/15 bg-surface p-6 font-mono text-sm text-foreground/55">
      No active policy. Register an agent on the Agents page to define one.
    </div>
  );
}

function PolicyHeader({ agent }: { agent: AgentState }) {
  const expires = new Date(agent.policy.expiryMs).toLocaleDateString();
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          Active policy
        </div>
        <div className="font-mono text-[10px] text-foreground/45">
          {agent.revokedAt === null ? `expires ${expires}` : "revoked"}
        </div>
      </div>
      <div className="mt-2 text-xl font-medium">{agent.agentLabel}</div>
      <div className="mt-1 font-mono text-xs text-foreground/55">
        hash {agent.policyHash}
      </div>
    </div>
  );
}

function ScopeList({ agent }: { agent: AgentState }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {agent.policy.scopes.map((s, i) => (
        <li
          key={i}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between">
            <div className="font-serif text-lg">{s.source}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              {s.read ? "read" : ""}
              {s.read && s.write ? " + " : ""}
              {s.write ? "write" : ""}
            </div>
          </div>
          {s.filters.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 font-mono text-xs text-foreground/70">
              {s.filters.map((f, j) => (
                <li
                  key={j}
                  className="rounded-md border border-foreground/10 bg-surface-2 px-2.5 py-1.5"
                >
                  {f}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function PolicyMeta({ agent }: { agent: AgentState }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Max queries"     value={String(agent.policy.maxQueries)} />
      <Stat label="Spend ceiling"   value={`$${agent.policy.spendCeilingUsd.toFixed(2)}`} />
      <Stat label="Scopes"          value={String(agent.policy.scopes.length)} />
      <Stat label="Status"          value={agent.revokedAt === null ? "active" : "revoked"} />
    </div>
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
