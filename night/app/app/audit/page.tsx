"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { readVault, readResult, type VaultState } from "@/lib/store";
import { readGraph, type FinancialGraph } from "@/lib/graph";
import type { UnderwritingResult } from "@/lib/mock";

interface AuditEvent {
  kind: "vault" | "graph" | "underwriting" | "proof" | "policy";
  ts: number;
  title: string;
  body: string;
  meta?: Array<{ label: string; value: string }>;
}

export default function AuditPage() {
  const [vault, setVault] = useState<VaultState | null>(null);
  const [result, setResult] = useState<UnderwritingResult | null>(null);
  const [graph, setGraph] = useState<FinancialGraph | null>(null);

  useEffect(() => {
    const refresh = () => {
      setVault(readVault());
      setResult(readResult());
      setGraph(readGraph());
    };
    refresh();
    window.addEventListener("nocturne:vault-change", refresh);
    window.addEventListener("nocturne:result-change", refresh);
    window.addEventListener("nocturne:graph-change", refresh);
    return () => {
      window.removeEventListener("nocturne:vault-change", refresh);
      window.removeEventListener("nocturne:result-change", refresh);
      window.removeEventListener("nocturne:graph-change", refresh);
    };
  }, []);

  const events: AuditEvent[] = [];
  if (vault) {
    events.push({
      kind: "vault",
      ts: vault.registeredAt,
      title: "Vault registered on Midnight",
      body: `${vault.fileName} · ${(vault.byteLength / 1024).toFixed(1)} KB ciphertext, local-only`,
      meta: [
        { label: "ciphertext hash", value: vault.ciphertextHash },
        { label: "commitment", value: vault.commitment },
      ],
    });
    events.push({
      kind: "policy",
      ts: vault.registeredAt,
      title: "Access policy set",
      body: `${vault.policy.queryTypes.join(", ")} · max ${vault.policy.maxUsesPerWeek}/wk · min $${vault.policy.minRoyalty.toFixed(2)} royalty`,
    });
  }
  if (graph) {
    events.push({
      kind: "graph",
      ts: graph.source.createdAt,
      title: "Financial graph extracted",
      body: `${graph.nodes.length} typed entities · ${graph.edges.length} relationships from ${graph.source.rowCount} CSV rows`,
    });
  }
  if (result) {
    events.push({
      kind: "underwriting",
      ts: Date.now(),
      title: "TEE underwriting attested",
      body: `Score ${result.score} · DSR ${(result.debtServiceRatio * 100).toFixed(1)}% · cohort ${result.cohortSize}`,
      meta: [
        { label: "TEE attestation", value: result.attestation },
        { label: "reasoning hash", value: result.reasoningHash },
      ],
    });
    events.push({
      kind: "proof",
      ts: Date.now(),
      title: "ZK ScoreProof issued",
      body: `Asserts score ≥ threshold without revealing transactions`,
      meta: [
        { label: "proof commitment", value: result.reasoningHash },
        { label: "income bucket", value: result.monthlyIncomeBucket },
      ],
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
          TEE attestations, ZK proof commitments, vault registrations, policy
          changes. The complete provenance trail for every interaction with
          your private data.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Vaults" value={vault ? "1" : "0"} />
        <Stat label="Entities" value={graph ? String(graph.nodes.length) : "0"} />
        <Stat label="Attestations" value={result ? "1" : "0"} />
        <Stat label="ZK proofs" value={result ? "1" : "0"} />
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-foreground/15 bg-surface p-6 font-mono text-sm text-foreground/55">
          No events yet. Upload a CSV on the Dashboard tab to start the trail.
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
    case "vault": return "VAULT REGISTER";
    case "graph": return "GRAPH EXTRACT";
    case "underwriting": return "TEE UNDERWRITE";
    case "proof": return "ZK PROOF";
    case "policy": return "POLICY";
  }
}
