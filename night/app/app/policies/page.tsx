"use client";

import { AppShell } from "@/components/app/AppShell";
import { useStoredAgent, type AgentState } from "@/lib/agents";

export default function PoliciesPage() {
  const agent = useStoredAgent();

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
          The complete bound applied to your active agent. Scope is a typed
          subgraph capability — node types, edge types, depth — not a string
          filter. Adjusting the policy requires a new signature and a new
          commitment; the previous policy hash stays in the audit trail forever.
        </p>
      </header>

      {agent === null ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          <PolicyHeader agent={agent} />
          {agent.policy.kgScope && <KgScopeCard agent={agent} />}
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
      <div className="mt-1 font-mono text-xs text-foreground/55 break-all">
        policy {agent.policyHash}
      </div>
      {agent.scopeHash && (
        <div className="mt-0.5 font-mono text-xs text-foreground/55 break-all">
          scope {agent.scopeHash}
        </div>
      )}
    </div>
  );
}

function KgScopeCard({ agent }: { agent: AgentState }) {
  const kg = agent.policy.kgScope;
  if (!kg) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Typed-graph capability
      </div>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ListBlock title="Allowed node types" items={kg.nodes} />
        <ListBlock title="Allowed edge types" items={kg.edges} />
        <div className="rounded-xl border border-foreground/10 bg-surface-2 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45">
            Max depth
          </div>
          <div className="mt-1 font-serif text-2xl text-foreground">{kg.maxDepth}</div>
          <div className="mt-2 font-mono text-[11px] text-foreground/55">
            Hops the agent may take from any seed before traversal halts.
          </div>
        </div>
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-surface-2 p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45">
        {title}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {items.map((t) => (
          <span
            key={t}
            className="rounded-md border border-foreground/15 bg-surface px-2 py-1 font-mono text-[11px] text-foreground/85"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScopeList({ agent }: { agent: AgentState }) {
  if (!agent.policy.scopes || agent.policy.scopes.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Legacy source filters
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {agent.policy.scopes.map((s, i) => (
          <li
            key={i}
            className="rounded-xl border border-foreground/10 bg-surface-2 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-serif text-base">{s.source}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                {s.read ? "read" : ""}
                {s.read && s.write ? " + " : ""}
                {s.write ? "write" : ""}
              </div>
            </div>
            {s.filters.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 font-mono text-[11px] text-foreground/70">
                {s.filters.map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PolicyMeta({ agent }: { agent: AgentState }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Max queries"     value={String(agent.policy.maxQueries)} />
      <Stat label="Spend ceiling"   value={`$${agent.policy.spendCeilingUsd.toFixed(2)}`} />
      <Stat label="Allowed types"   value={String(agent.policy.kgScope?.nodes.length ?? 0)} />
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
