"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { shortHash, sleep } from "@/lib/mock";
import { appendQuery, readAgent, type AgentState } from "@/lib/agents";
import { Button } from "@/components/ui/Button";

type DemoState = "idle" | "running" | "allowed" | "rejected";

const SCENARIOS = [
  {
    id: "in-scope",
    label: "In-scope: summarise Stripe invoices",
    expect: "allowed" as const,
    description: "Reads invoice emails. Policy permits gmail read. Returns a private summary.",
  },
  {
    id: "out-of-scope",
    label: "Out-of-scope: send email on your behalf",
    expect: "rejected" as const,
    description: "Attempts gmail write. Policy forbids it. Authorization check fails on chain.",
  },
  {
    id: "post-revoke",
    label: "Post-revoke: any query",
    expect: "rejected" as const,
    description: "Agent revoked. Every subsequent query fails before execution.",
  },
];

export default function DemoPage() {
  const [agent, setAgent] = useState<AgentState | null>(null);
  const [state, setState] = useState<DemoState>("idle");
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    setAgent(readAgent());
    const refresh = () => setAgent(readAgent());
    window.addEventListener("nocturne:agent-change", refresh);
    return () => window.removeEventListener("nocturne:agent-change", refresh);
  }, []);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  async function runScenario() {
    if (!agent) return;
    setState("running");
    setLog([]);
    const push = (line: string) => setLog((l) => [...l, line]);

    push("agent.request <- " + scenario.label);
    await sleep(360);
    push("AgentRegistry.is_authorized?(agent_id, scope_hash, query_hash)");
    await sleep(520);

    const isRevoked = agent.revokedAt !== null;
    const allowed =
      scenario.expect === "allowed" && !isRevoked && scenario.id === "in-scope";

    if (!allowed) {
      push("-> false");
      push(
        isRevoked
          ? "policy revoked — terminating"
          : "scope mismatch — terminating",
      );
      appendQuery({
        agentId: agent.agentId,
        queryHash: shortHash(`q:${scenario.id}:${Date.now()}`),
        queryLabel: scenario.label,
        resultCommitment: "—",
        paymentUsd: 0,
        ts: Date.now(),
        txHash: shortHash(`tx:rej:${Date.now()}`),
        allowed: false,
      });
      setState("rejected");
      return;
    }

    push("-> true");
    await sleep(420);
    push("phala://underwrite (model running inside attested enclave)");
    await sleep(820);
    push("AgentRegistry.log_query(query_hash, result_commitment, payment)");
    await sleep(420);
    push("-> committed at block height 14,219,837");

    appendQuery({
      agentId: agent.agentId,
      queryHash: shortHash(`q:${scenario.id}:${Date.now()}`),
      queryLabel: scenario.label,
      resultCommitment: shortHash(`r:${scenario.id}:${Date.now()}`),
      paymentUsd: 0.12,
      ts: Date.now(),
      txHash: shortHash(`tx:ok:${Date.now()}`),
      allowed: true,
    });
    setState("allowed");
  }

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Live demo
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Watch enforcement happen.{" "}
          <span className="text-foreground/55">In scope. Out of scope. Revoked.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Three scenarios against the active agent. The chain accepts the
          first and rejects the others — the agent has no way to override.
        </p>
      </header>

      {agent === null ? (
        <div className="rounded-2xl border border-foreground/15 bg-surface p-6 font-mono text-sm text-foreground/55">
          Register an agent on the Agents page first.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-3">
            {SCENARIOS.map((s) => {
              const active = s.id === scenarioId;
              return (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  className={`text-left rounded-2xl border px-5 py-4 transition-colors ${
                    active
                      ? "border-foreground bg-surface-2"
                      : "border-border bg-surface hover:bg-surface-2"
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="mt-1 text-xs leading-5 text-foreground/65">
                    {s.description}
                  </div>
                </button>
              );
            })}
            <div className="mt-2">
              <Button onClick={runScenario} disabled={state === "running"} size="lg">
                {state === "running" ? "Running…" : "Run scenario"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              Chain trace
            </div>
            {log.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/55">
                Pick a scenario, then run. Trace appears here.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-1 font-mono text-xs">
                {log.map((line, i) => (
                  <li key={i} className="text-foreground/80">
                    {line}
                  </li>
                ))}
              </ul>
            )}
            {state !== "idle" && state !== "running" && (
              <div
                className={`mt-5 rounded-xl border p-4 text-sm ${
                  state === "allowed"
                    ? "border-emerald-700/40 bg-emerald-700/[0.06] text-foreground"
                    : "border-red-700/40 bg-red-700/[0.06] text-foreground"
                }`}
              >
                {state === "allowed"
                  ? "Authorized. Result committed on chain."
                  : "Rejected at authorization. Nothing executed."}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
