"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphView } from "./GraphView";
import { SEED_GRAPH } from "@/lib/kg/seed";
import { ALL_EDGE_TYPES, ALL_NODE_TYPES, type EdgeType, type NodeType } from "@/lib/kg/types";
import { scopeHash, type KgScope } from "@/lib/kg/scope";
import { runTraversal, type TraversalResult } from "@/lib/kg/traversal";
import { AGENT_TEMPLATES, useStoredAgent } from "@/lib/agents";

export function KgConsole() {
  const [templateId, setTemplateId] = useState(AGENT_TEMPLATES[0].id);
  const template = AGENT_TEMPLATES.find((t) => t.id === templateId) ?? AGENT_TEMPLATES[0];
  const [scope, setScope] = useState<KgScope>(template.kgScope);
  const [seedId, setSeedId] = useState<string>(template.kgSeedNodeId);
  const [result, setResult] = useState<TraversalResult | null>(null);
  const [running, setRunning] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [scopeFp, setScopeFp] = useState<string>("");
  const agent = useStoredAgent();

  function selectTemplate(id: string) {
    const t = AGENT_TEMPLATES.find((x) => x.id === id) ?? AGENT_TEMPLATES[0];
    setTemplateId(id);
    setScope(t.kgScope);
    setSeedId(t.kgSeedNodeId);
    setResult(null);
    setCurrentNodeId(null);
  }

  useEffect(() => {
    let cancelled = false;
    scopeHash(scope).then((h) => { if (!cancelled) setScopeFp(h); });
    return () => { cancelled = true; };
  }, [scope]);

  const visitedNodes = useMemo(() => new Set(result?.visitedNodeIds ?? []), [result]);
  const visitedEdges = useMemo(() => new Set(result?.visitedEdgeIds ?? []), [result]);

  async function run() {
    setRunning(true);
    setResult(null);
    setCurrentNodeId(null);
    const r = await runTraversal(SEED_GRAPH, scope, { seedNodeId: seedId, pattern: templateId });

    const orderedNodeIds: string[] = [];
    for (const s of r.steps) {
      if (s.allowed && !orderedNodeIds.includes(s.nodeId)) orderedNodeIds.push(s.nodeId);
    }
    for (const id of orderedNodeIds) {
      setCurrentNodeId(id);
      await sleep(220);
    }
    setCurrentNodeId(null);
    setResult(r);
    setRunning(false);
  }

  function toggleNode(t: NodeType) {
    setScope((s) => ({
      ...s,
      nodes: s.nodes.includes(t) ? s.nodes.filter((x) => x !== t) : [...s.nodes, t],
    }));
  }
  function toggleEdge(t: EdgeType) {
    setScope((s) => ({
      ...s,
      edges: s.edges.includes(t) ? s.edges.filter((x) => x !== t) : [...s.edges, t],
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          Scope template
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {AGENT_TEMPLATES.map((t) => {
            const active = t.id === templateId;
            return (
              <button
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-foreground bg-surface-2 text-foreground"
                    : "border-border bg-surface hover:bg-surface-2 text-foreground/70"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Allowed node types
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALL_NODE_TYPES.map((t) => {
                const on = scope.nodes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleNode(t)}
                    className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/25 bg-surface text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Allowed edge types
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALL_EDGE_TYPES.map((t) => {
                const on = scope.edges.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleEdge(t)}
                    className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/25 bg-surface text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Max depth
            </div>
            <input
              type="number"
              min={1}
              max={6}
              value={scope.maxDepth}
              onChange={(e) => setScope((s) => ({ ...s, maxDepth: Math.max(1, Math.min(6, Number(e.target.value))) }))}
              className="mt-1 w-24 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm focus:border-foreground focus:outline-none"
            />
          </div>
          <div className="grow font-mono text-[10px] text-foreground/45 break-all">
            scope_hash {scopeFp || "…"}
          </div>
          <button
            onClick={run}
            disabled={running}
            className="rounded-lg bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-widest text-background disabled:opacity-50"
          >
            {running ? "Traversing…" : "Run traversal"}
          </button>
        </div>
      </div>

      <GraphView
        graph={SEED_GRAPH}
        scope={scope}
        visitedNodeIds={visitedNodes}
        visitedEdgeIds={visitedEdges}
        currentNodeId={currentNodeId}
        height={520}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ResultPanel result={result} />
        <StepsPanel result={result} />
      </div>

      {agent && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 font-mono text-[11px] text-foreground/55">
          Active agent <span className="text-foreground/85">{agent.agentLabel}</span> · policy {agent.policyHash.slice(0, 18)}…
          Run a traversal — out-of-scope hops are rejected in the TEE before they ever reach Midnight.
        </p>
      )}
    </div>
  );
}

function ResultPanel({ result }: { result: TraversalResult | null }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Traversal result
      </div>
      {!result ? (
        <p className="mt-3 text-sm text-foreground/55">
          Pick a template, adjust the scope, then run a traversal. Allowed types light up green; out-of-scope types are dimmed; rejected hops are dashed red.
        </p>
      ) : result.aborted ? (
        <div className="mt-3 text-sm text-foreground/80">
          <div className="font-medium text-[#a4262c]">Aborted</div>
          <div className="mt-1 text-foreground/65">{result.abortReason}</div>
        </div>
      ) : (
        <dl className="mt-3 grid grid-cols-1 gap-2 font-mono text-[11px]">
          <Field label="visited nodes"        value={String(result.visitedNodeIds.length)} />
          <Field label="visited edges"        value={String(result.visitedEdgeIds.length)} />
          <Field label="rejected hops"        value={String(result.steps.filter((s) => !s.allowed).length)} />
          <Field label="query_hash"           value={result.queryHash} />
          <Field label="result_commitment"    value={result.resultCommitment} />
        </dl>
      )}
    </div>
  );
}

function StepsPanel({ result }: { result: TraversalResult | null }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Step trace
      </div>
      {!result ? (
        <p className="mt-3 text-sm text-foreground/55">
          Per-hop check: every node/edge type compared against scope before traversal continues.
        </p>
      ) : (
        <ul className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto font-mono text-[11px]">
          {result.steps.map((s, i) => (
            <li
              key={i}
              className={`rounded-md border px-2 py-1.5 ${
                s.allowed
                  ? "border-foreground/15 bg-surface-2 text-foreground/85"
                  : "border-[#a4262c]/40 bg-[#a4262c]/[0.06] text-[#a4262c]"
              }`}
            >
              <span className="text-foreground/45">d{s.depth}</span>{" "}
              {s.fromNodeId ?? "·"} → {s.nodeId}{" "}
              {s.allowed ? "ok" : `× ${s.blockedReason}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-foreground/10 bg-surface-2 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-foreground/45">
        {label}
      </div>
      <div className="truncate text-foreground/85">{value}</div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type { KgScope };
