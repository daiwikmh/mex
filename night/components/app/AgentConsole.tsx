"use client";

import { useEffect, useState } from "react";
import { shortHash, sleep } from "@/lib/mock";
import {
  AGENT_TEMPLATES,
  appendQuery,
  hashPolicy,
  readAgent,
  type AgentPolicy,
  type AgentScope,
  type AgentState,
  writeAgent,
} from "@/lib/agents";
import { StepFlow, type Step } from "./StepFlow";
import { Button } from "@/components/ui/Button";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function AgentConsole() {
  const [agent, setAgent] = useState<AgentState | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [templateId, setTemplateId] = useState<string>(AGENT_TEMPLATES[0].id);
  const [days, setDays] = useState(30);
  const [maxQueries, setMaxQueries] = useState(40);
  const [spend, setSpend] = useState(20);

  useEffect(() => {
    setAgent(readAgent());
    const refresh = () => setAgent(readAgent());
    window.addEventListener("nocturne:agent-change", refresh);
    return () => window.removeEventListener("nocturne:agent-change", refresh);
  }, []);

  const template = AGENT_TEMPLATES.find((t) => t.id === templateId) ?? AGENT_TEMPLATES[0];

  async function registerAgent() {
    setRunning(true);
    const policy: AgentPolicy = {
      scopes: template.scopes as AgentScope[],
      expiryMs: Date.now() + days * ONE_DAY,
      maxQueries,
      spendCeilingUsd: spend,
    };
    const flow: Step[] = [
      { id: "sign",   label: "Sign owner commitment with wallet", status: "active" },
      { id: "reg",    label: "Submit register_agent to Midnight", status: "pending" },
      { id: "policy", label: "Set scoped policy on chain",        status: "pending" },
      { id: "ready",  label: "Agent ready under bounded scope",   status: "pending" },
    ];
    setSteps(flow);

    await sleep(420);
    setSteps((s) => patch(s, [["sign", "done"], ["reg", "active"]]));
    await sleep(560);
    setSteps((s) => patch(s, [["reg", "done"], ["policy", "active"]]));
    await sleep(540);
    setSteps((s) => patch(s, [["policy", "done"], ["ready", "active"]]));
    await sleep(320);

    const policyHash = hashPolicy(policy);
    const agentId = shortHash(`agent:${template.id}:${Date.now()}`);
    const next: AgentState = {
      agentId,
      agentLabel: template.label,
      ownerCommitment: shortHash(`owner:${agentId}`),
      policy,
      policyHash,
      registeredAt: Date.now(),
      revokedAt: null,
      contractAddress: null,
      registerTxHash: shortHash(`tx:register:${agentId}`),
    };
    writeAgent(next);
    setSteps((s) => patch(s, [["ready", "done"]]));
    setRunning(false);
  }

  async function simulateQuery() {
    if (!agent || agent.revokedAt !== null) return;
    setRunning(true);
    const queryLabel = `${agent.policy.scopes[0]?.source ?? "agent"} · summarise last 24h`;
    const flow: Step[] = [
      { id: "scope",  label: "TEE checks query is in scope",        status: "active" },
      { id: "exec",   label: "Agent executes inside attested enclave", status: "pending" },
      { id: "commit", label: "Commit result hash + payment to chain",  status: "pending" },
    ];
    setSteps(flow);
    await sleep(420);
    setSteps((s) => patch(s, [["scope", "done"], ["exec", "active"]]));
    await sleep(720);
    setSteps((s) => patch(s, [["exec", "done"], ["commit", "active"]]));
    await sleep(420);

    const queryHash = shortHash(`q:${agent.agentId}:${Date.now()}`);
    appendQuery({
      agentId: agent.agentId,
      queryHash,
      queryLabel,
      resultCommitment: shortHash(`r:${queryHash}`),
      paymentUsd: 0.12,
      ts: Date.now(),
      txHash: shortHash(`tx:q:${queryHash}`),
      allowed: true,
    });
    setSteps((s) => patch(s, [["commit", "done"]]));
    setRunning(false);
  }

  async function revoke() {
    if (!agent || agent.revokedAt !== null) return;
    setRunning(true);
    const flow: Step[] = [
      { id: "tx", label: "Submit revoke_agent to Midnight", status: "active" },
      { id: "kill", label: "Chain enforces termination",   status: "pending" },
    ];
    setSteps(flow);
    await sleep(540);
    setSteps((s) => patch(s, [["tx", "done"], ["kill", "active"]]));
    await sleep(420);
    writeAgent({ ...agent, revokedAt: Date.now() });
    setSteps((s) => patch(s, [["kill", "done"]]));
    setRunning(false);
  }

  function reset() {
    writeAgent(null);
    setSteps([]);
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Agents
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Stand up the agent.{" "}
          <span className="text-foreground/55">Bound by a scope you signed.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Pick a template, set the policy, sign it once. The agent receives a
          capability bound to that exact scope. Every query it makes lands on
          chain. Revoke any time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          {!agent ? (
            <PolicyForm
              templateId={templateId}
              setTemplateId={setTemplateId}
              days={days}
              setDays={setDays}
              maxQueries={maxQueries}
              setMaxQueries={setMaxQueries}
              spend={spend}
              setSpend={setSpend}
              onSubmit={registerAgent}
              disabled={running}
            />
          ) : (
            <AgentCard agent={agent} onReset={reset} />
          )}

          {agent && agent.revokedAt === null && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                Step 2
              </div>
              <div className="text-lg font-medium">Run a scoped query.</div>
              <p className="text-sm text-foreground/65">
                Simulates the agent reading data inside the TEE under its
                policy. A hash of the request and a commitment to the result
                land on Midnight. Raw data never leaves the enclave.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={simulateQuery} disabled={running}>
                  {running ? "Running…" : "Run query"}
                </Button>
                <Button onClick={revoke} disabled={running} variant="ghost">
                  Revoke agent
                </Button>
              </div>
            </div>
          )}

          {agent && agent.revokedAt !== null && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                Revoked
              </div>
              <div className="mt-2 text-lg font-medium">
                Agent terminated on chain.
              </div>
              <p className="mt-1 text-sm text-foreground/65">
                Any further query attempt will fail authorization at the
                ledger. The receipt is permanent.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <StepFlow steps={steps} />
          <NetworkLog agent={agent} />
        </div>
      </div>
    </div>
  );
}

function PolicyForm({
  templateId, setTemplateId,
  days, setDays,
  maxQueries, setMaxQueries,
  spend, setSpend,
  onSubmit, disabled,
}: {
  templateId: string;
  setTemplateId: (v: string) => void;
  days: number;
  setDays: (v: number) => void;
  maxQueries: number;
  setMaxQueries: (v: number) => void;
  spend: number;
  setSpend: (v: number) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Step 1 · choose a template
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {AGENT_TEMPLATES.map((t) => {
          const active = t.id === templateId;
          return (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                active
                  ? "border-foreground bg-surface-2"
                  : "border-border bg-surface hover:bg-surface-2"
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className="mt-1 text-xs leading-5 text-foreground/65">
                {t.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumberField label="Expires in (days)"     value={days}        setValue={setDays}        min={1}  max={90}  step={1}  />
        <NumberField label="Max queries"           value={maxQueries}  setValue={setMaxQueries}  min={1}  max={1000} step={1} />
        <NumberField label="Spend ceiling (USD)"   value={spend}       setValue={setSpend}       min={0}  max={500}  step={1} />
      </div>

      <div className="mt-6">
        <Button onClick={onSubmit} disabled={disabled} size="lg">
          {disabled ? "Submitting…" : "Sign + register on Midnight"}
        </Button>
        <p className="mt-2 font-mono text-[11px] text-foreground/50">
          One wallet signature. Two transactions: register_agent, set_policy.
        </p>
      </div>
    </div>
  );
}

function NumberField({
  label, value, setValue, min, max, step,
}: {
  label: string; value: number; setValue: (n: number) => void;
  min: number; max: number; step: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-foreground focus:border-foreground focus:outline-none"
      />
    </label>
  );
}

function AgentCard({ agent, onReset }: { agent: AgentState; onReset: () => void }) {
  const expires = new Date(agent.policy.expiryMs).toLocaleDateString();
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          Agent registered
        </div>
        <button
          onClick={onReset}
          className="font-mono text-xs text-foreground/50 hover:text-foreground"
        >
          reset
        </button>
      </div>
      <div className="mt-3 text-xl font-medium">{agent.agentLabel}</div>
      <div className="mt-1 text-sm text-foreground/55">
        {agent.policy.scopes.length} scope{agent.policy.scopes.length === 1 ? "" : "s"} · expires {expires}
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
        <Field label="Agent id"          value={agent.agentId} />
        <Field label="Policy hash"       value={agent.policyHash} />
        <Field label="Owner commitment"  value={agent.ownerCommitment} />
        <Field label="register tx"       value={agent.registerTxHash ?? "—"} />
      </dl>
      <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-xs text-foreground/70">
        <div className="font-mono uppercase tracking-widest text-foreground/40">
          Scope
        </div>
        <ul className="mt-2 flex flex-col gap-1">
          {agent.policy.scopes.map((s, i) => (
            <li key={i} className="font-mono">
              {s.source} · {s.read ? "read" : ""}{s.read && s.write ? "+" : ""}{s.write ? "write" : ""} · {s.filters.join(", ") || "—"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-foreground/40">
        {label}
      </div>
      <div className="mt-0.5 truncate text-foreground/85">{value}</div>
    </div>
  );
}

function NetworkLog({ agent }: { agent: AgentState | null }) {
  const rows: { tag: string; body: string }[] = [];
  if (agent) {
    rows.push({
      tag: "midnight://AgentRegistry.register_agent",
      body: `agent_id=${agent.agentId} ok`,
    });
    rows.push({
      tag: "midnight://AgentRegistry.set_policy",
      body: `policy_hash=${agent.policyHash} max=${agent.policy.maxQueries}`,
    });
    if (agent.revokedAt !== null) {
      rows.push({
        tag: "midnight://AgentRegistry.revoke_agent",
        body: `agent_id=${agent.agentId} revoked_at=${new Date(agent.revokedAt).toISOString()}`,
      });
    }
  }
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Network tab (what egresses)
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/55">
          Nothing yet. The only bytes that leave the browser are policy
          hashes and signatures.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2 font-mono text-xs">
          {rows.map((r, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <div className="text-foreground/80">{r.tag}</div>
              <div className="mt-0.5 text-foreground/55">{r.body}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 font-mono text-[11px] text-foreground/40">
        Raw inputs and outputs stay inside the TEE. Only commitments egress.
      </div>
    </div>
  );
}

function patch(
  steps: Step[],
  patches: Array<[string, Step["status"]]>,
): Step[] {
  return steps.map((s) => {
    const hit = patches.find(([id]) => id === s.id);
    return hit ? { ...s, status: hit[1] } : s;
  });
}
