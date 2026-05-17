"use client";

import { useState } from "react";
import { sleep } from "@/lib/mock";
import {
  AGENT_TEMPLATES,
  appendQuery,
  hashPolicy,
  useStoredAgent,
  type AgentPolicy,
  type AgentScope,
  type AgentState,
  type AgentTemplate,
  writeAgent,
} from "@/lib/agents";
import { SEED_GRAPH, getNode } from "@/lib/kg/seed";
import { scopeHash, sha256Hex } from "@/lib/kg/scope";
import { runTraversal } from "@/lib/kg/traversal";
import { useWallet, shortAddress } from "@/lib/midnight/wallet";
import { signPolicyHash } from "@/lib/midnight/sign";
import { useRuntime } from "@/lib/midnight/runtime";
import { bytes32 } from "@/lib/midnight/agent-registry-client";
import { StepFlow, type Step } from "./StepFlow";
import { Button } from "@/components/ui/Button";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function AgentConsole() {
  const wallet = useWallet();
  const runtime = useRuntime();
  const agent = useStoredAgent();
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>(AGENT_TEMPLATES[0].id);
  const [days, setDays] = useState(30);
  const [maxQueries, setMaxQueries] = useState(40);
  const [spend, setSpend] = useState(20);

  const template: AgentTemplate =
    AGENT_TEMPLATES.find((t) => t.id === templateId) ?? AGENT_TEMPLATES[0];
  const connected = wallet.connected;
  const chainReady = runtime.status === "ready" && runtime.registry !== null;

  async function registerAgent() {
    if (!connected) {
      setError("Connect a Midnight wallet first.");
      return;
    }
    setError(null);
    setRunning(true);
    const policy: AgentPolicy = {
      scopes: template.scopes as AgentScope[],
      kgScope: template.kgScope,
      kgSeedNodeId: template.kgSeedNodeId,
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

    const scopeFp = await scopeHash(template.kgScope);
    const polFp = await hashPolicy(policy);

    let signature: string;
    try {
      const signed = await signPolicyHash(connected, polFp);
      signature = signed.signature;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Wallet signing failed: ${msg}`);
      setSteps((s) => patch(s, [["sign", "pending"]]));
      setRunning(false);
      return;
    }
    setSteps((s) => patch(s, [["sign", "done"], ["reg", "active"]]));

    const agentIdHex = await sha256Hex(
      `agent:${template.id}:${connected.shieldedAddress}:${Date.now()}`,
    );
    const ownerCommitmentHex = await sha256Hex(
      `owner:${connected.shieldedAddress}:${signature.slice(0, 16)}`,
    );

    let registerTxId: string | null = null;
    let setPolicyTxId: string | null = null;

    if (chainReady) {
      try {
        const expirySec = BigInt(Math.floor(policy.expiryMs / 1000));
        const maxQ = BigInt(policy.maxQueries);

        const regTx = await runtime.registry.callTx.register_agent(
          bytes32(agentIdHex),
          bytes32(ownerCommitmentHex),
        );
        registerTxId = String(regTx?.public?.txId ?? "");
        setSteps((s) => patch(s, [["reg", "done"], ["policy", "active"]]));

        const polTx = await runtime.registry.callTx.set_policy(
          bytes32(agentIdHex),
          bytes32(scopeFp),
          bytes32(polFp),
          expirySec,
          maxQ,
        );
        setPolicyTxId = String(polTx?.public?.txId ?? "");
        setSteps((s) => patch(s, [["policy", "done"], ["ready", "active"]]));
        await sleep(180);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`Chain call failed: ${msg}`);
        setSteps((s) => patch(s, [["reg", "error"], ["policy", "pending"], ["ready", "pending"]]));
        setRunning(false);
        return;
      }
    } else {
      await sleep(560);
      setSteps((s) => patch(s, [["reg", "done"], ["policy", "active"]]));
      await sleep(540);
      setSteps((s) => patch(s, [["policy", "done"], ["ready", "active"]]));
      await sleep(320);
    }

    const next: AgentState = {
      agentId: agentIdHex.slice(0, 18),
      agentLabel: template.label,
      ownerCommitment: ownerCommitmentHex.slice(0, 18),
      policy,
      policyHash: polFp,
      scopeHash: scopeFp,
      registeredAt: Date.now(),
      revokedAt: null,
      contractAddress: runtime.registryAddress,
      registerTxHash: registerTxId ?? (await sha256Hex(`tx:register:${agentIdHex}:${Date.now()}`)).slice(0, 18),
    };
    writeAgent(next);
    if (setPolicyTxId) console.info("set_policy tx", setPolicyTxId);
    setSteps((s) => patch(s, [["ready", "done"]]));
    setRunning(false);
  }

  async function simulateQuery() {
    if (!agent || agent.revokedAt !== null) return;
    if (!agent.policy.kgScope || !agent.policy.kgSeedNodeId) return;
    setRunning(true);

    const seedNode = getNode(agent.policy.kgSeedNodeId);
    const queryLabel = seedNode
      ? `Traversal from ${seedNode.type} · ${seedNode.label}`
      : `Traversal from ${agent.policy.kgSeedNodeId}`;

    const flow: Step[] = [
      { id: "scope",  label: "TEE checks traversal against typed scope",   status: "active" },
      { id: "exec",   label: "Agent walks the graph inside the enclave",   status: "pending" },
      { id: "commit", label: "Commit subgraph hash + tx to Midnight",      status: "pending" },
    ];
    setSteps(flow);
    await sleep(380);
    setSteps((s) => patch(s, [["scope", "done"], ["exec", "active"]]));

    const traversal = await runTraversal(SEED_GRAPH, agent.policy.kgScope, {
      seedNodeId: agent.policy.kgSeedNodeId,
      pattern: `tpl:${agent.agentLabel}`,
    });
    await sleep(420);
    setSteps((s) => patch(s, [["exec", "done"], ["commit", "active"]]));

    const allowed = !traversal.aborted;
    let txHash = (await sha256Hex(`tx:q:${traversal.queryHash}:${Date.now()}`)).slice(0, 18);

    if (chainReady && allowed) {
      try {
        const tsSec = BigInt(Math.floor(Date.now() / 1000));
        const tx = await runtime.registry.callTx.log_query(
          bytes32(agent.agentId.padEnd(64, "0")),
          bytes32(traversal.queryHash),
          bytes32(traversal.resultCommitment),
          tsSec,
        );
        txHash = String(tx?.public?.txId ?? txHash);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("log_query failed", msg);
        setError(`log_query failed: ${msg}`);
      }
    } else {
      await sleep(280);
    }

    appendQuery({
      agentId: agent.agentId,
      queryHash: traversal.queryHash,
      queryLabel,
      resultCommitment: traversal.resultCommitment,
      paymentUsd: allowed ? 0.12 : 0,
      ts: Date.now(),
      txHash: allowed ? txHash : null,
      allowed,
      visitedNodeIds: traversal.visitedNodeIds,
      visitedEdgeIds: traversal.visitedEdgeIds,
      abortReason: traversal.abortReason,
    });
    setSteps((s) => patch(s, [["commit", allowed ? "done" : "error"]]));
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

    if (chainReady) {
      try {
        await runtime.registry.callTx.revoke_agent(bytes32(agent.agentId.padEnd(64, "0")));
        setSteps((s) => patch(s, [["tx", "done"], ["kill", "active"]]));
        await sleep(200);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`revoke_agent failed: ${msg}`);
        setSteps((s) => patch(s, [["tx", "error"]]));
        setRunning(false);
        return;
      }
    } else {
      await sleep(540);
      setSteps((s) => patch(s, [["tx", "done"], ["kill", "active"]]));
      await sleep(420);
    }
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
          <span className="text-foreground/55">Bound by a typed-graph scope you signed.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Pick a template, set the policy, sign it once. The agent receives a
          capability bound to a typed subgraph of your data. Every traversal
          it runs lands on chain. Revoke any time.
        </p>
      </header>

      {connected ? (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-emerald-700/30 bg-emerald-700/[0.04] px-4 py-3 font-mono text-xs text-foreground/80">
            Wallet connected · {shortAddress(connected.shieldedAddress, 10, 8)} · network {connected.config.networkId}
          </div>
          <RuntimeBanner
            status={runtime.status}
            address={runtime.registryAddress}
            error={runtime.error}
            freshlyDeployed={runtime.freshlyDeployed}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-amber-600/40 bg-amber-600/[0.06] px-4 py-3 font-mono text-xs text-foreground/85">
          No wallet connected. Use the chip in the sidebar to connect a Midnight wallet before registering an agent.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-700/40 bg-red-700/[0.06] px-4 py-3 font-mono text-xs text-foreground/85">
          {error}
        </div>
      )}

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
              disabled={running || !connected}
            />
          ) : (
            <AgentCard agent={agent} onReset={reset} />
          )}

          {agent && agent.revokedAt === null && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                Step 2
              </div>
              <div className="text-lg font-medium">Run a scoped traversal.</div>
              <p className="text-sm text-foreground/65">
                The TEE walks the knowledge graph from a seed node. Every
                step checks node and edge type against the scope. Out-of-scope
                hops abort the query before it reaches Midnight. The visited
                subgraph is committed; the data itself never leaves the enclave.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={simulateQuery} disabled={running}>
                  {running ? "Running…" : "Run traversal"}
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
                Any further traversal attempt will fail authorization at the
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
  const template =
    AGENT_TEMPLATES.find((t) => t.id === templateId) ?? AGENT_TEMPLATES[0];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Step 1 · choose a template
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                {t.kgScope.nodes.map((n) => (
                  <span key={n} className="rounded border border-foreground/15 bg-surface px-1.5 py-0.5">
                    {n}
                  </span>
                ))}
                <span className="text-foreground/40">depth {t.kgScope.maxDepth}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 bg-surface-2 px-4 py-3 font-mono text-[11px] text-foreground/65">
        Typed scope: nodes [{template.kgScope.nodes.join(", ")}] · edges [{template.kgScope.edges.join(", ")}] · max depth {template.kgScope.maxDepth}
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
          One wallet signature. Two transactions: register_agent, set_policy. Scope hash committed.
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
  const kg = agent.policy.kgScope;
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
        expires {expires} · max {agent.policy.maxQueries} queries
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
        <Field label="Agent id"          value={agent.agentId} />
        <Field label="Policy hash"       value={agent.policyHash} />
        <Field label="Scope hash"        value={agent.scopeHash} />
        <Field label="Owner commitment"  value={agent.ownerCommitment} />
      </dl>
      {kg && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-xs text-foreground/70">
          <div className="font-mono uppercase tracking-widest text-foreground/40">
            Typed scope
          </div>
          <div className="mt-2 font-mono">
            <div><span className="text-foreground/45">nodes</span> [{kg.nodes.join(", ")}]</div>
            <div className="mt-1"><span className="text-foreground/45">edges</span> [{kg.edges.join(", ")}]</div>
            <div className="mt-1"><span className="text-foreground/45">depth</span> {kg.maxDepth}</div>
          </div>
        </div>
      )}
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
      body: `scope_hash=${agent.scopeHash.slice(0, 18)}… max=${agent.policy.maxQueries}`,
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
          Nothing yet. The only bytes that leave the browser are scope and
          policy hashes plus a signature.
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

function RuntimeBanner({
  status, address, error, freshlyDeployed,
}: {
  status: string;
  address: string | null;
  error: string | null;
  freshlyDeployed: boolean;
}) {
  if (status === "ready") {
    return (
      <div className="rounded-xl border border-emerald-700/30 bg-emerald-700/[0.04] px-4 py-3 font-mono text-xs text-foreground/85">
        Registry contract {freshlyDeployed ? "deployed" : "found"} at {address ? `${address.slice(0, 14)}…${address.slice(-8)}` : "—"}. Real chain calls active.
      </div>
    );
  }
  if (status === "preparing" || status === "deploying") {
    return (
      <div className="rounded-xl border border-amber-600/40 bg-amber-600/[0.06] px-4 py-3 font-mono text-xs text-foreground/85">
        {status === "preparing"
          ? "Building Midnight providers (proving, indexer, wallet bridge)…"
          : "Deploying AgentRegistry contract on chain. Make sure your wallet has Dust. First deploy may take 30–60s."}
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-700/40 bg-red-700/[0.06] px-4 py-3 font-mono text-xs text-foreground/85">
        Midnight runtime error: {error ?? "unknown"}. Fund your wallet at the faucet and reconnect, or click reset.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-foreground/15 bg-surface px-4 py-3 font-mono text-xs text-foreground/70">
      Midnight runtime idle. Chain calls will be mocked until the registry contract is ready.
    </div>
  );
}
