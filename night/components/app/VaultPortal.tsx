"use client";

import { useEffect, useState } from "react";
import { mockUnderwriting, shortHash, sleep, type UnderwritingResult } from "@/lib/mock";
import { readResult, readVault, writeResult, writeVault, type VaultState } from "@/lib/store";
import { buildGraph, parseBankCsv, writeGraph } from "@/lib/graph";
import { Dropzone } from "./Dropzone";
import { StepFlow, type Step } from "./StepFlow";
import { ResultPanel } from "./ResultPanel";
import { Button } from "@/components/ui/Button";

export function VaultPortal() {
  const [vault, setVault] = useState<VaultState | null>(null);
  const [result, setResult] = useState<UnderwritingResult | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    setVault(readVault());
    setResult(readResult());
    const onVault = () => setVault(readVault());
    const onResult = () => setResult(readResult());
    window.addEventListener("nocturne:vault-change", onVault);
    window.addEventListener("nocturne:result-change", onResult);
    return () => {
      window.removeEventListener("nocturne:vault-change", onVault);
      window.removeEventListener("nocturne:result-change", onResult);
    };
  }, []);

  async function handleFile(file: File) {
    setRunning(true);
    setResult(null);
    writeResult(null);

    const baseSteps: Step[] = [
      { id: "read", label: "Parse Plaid CSV in browser", status: "active" },
      { id: "graph", label: "Extract typed financial graph (entities + edges)", status: "pending" },
      { id: "encrypt", label: "AES-GCM encrypt with wallet-derived key", status: "pending" },
      { id: "store", label: "Persist ciphertext to IndexedDB", status: "pending" },
      { id: "register", label: "Register commitment on Midnight", status: "pending" },
    ];
    setSteps(baseSteps);

    const buf = await file.arrayBuffer();
    const text = new TextDecoder().decode(buf);
    await sleep(320);
    setSteps((s) =>
      setStatus(s, [
        ["read", "done"],
        ["graph", "active"],
      ]),
    );

    const rows = parseBankCsv(text);
    const graph = buildGraph(rows, file.name);
    writeGraph(graph);
    await sleep(520);
    setSteps((s) =>
      setStatus(s, [
        ["graph", "done"],
        ["encrypt", "active"],
      ]),
    );

    await sleep(520);
    const cipherHash = shortHash(`${file.name}:${buf.byteLength}`);
    setSteps((s) =>
      setStatus(s, [
        ["encrypt", "done"],
        ["store", "active"],
      ]),
    );

    await sleep(320);
    setSteps((s) =>
      setStatus(s, [
        ["store", "done"],
        ["register", "active"],
      ]),
    );

    await sleep(560);
    const commitment = shortHash(`commit:${cipherHash}`);
    const v: VaultState = {
      fileName: file.name,
      byteLength: buf.byteLength,
      ciphertextHash: cipherHash,
      commitment,
      registeredAt: Date.now(),
      policy: {
        queryTypes: ["credit-score-v1"],
        maxUsesPerWeek: 12,
        minRoyalty: 0.5,
      },
    };
    writeVault(v);
    setSteps((s) => setStatus(s, [["register", "done"]]));
    setRunning(false);
  }

  async function requestUnderwriting() {
    if (!vault) return;
    setRunning(true);
    const flow: Step[] = [
      { id: "cap", label: "Issue agent capability to TEE", status: "active" },
      { id: "fetch", label: "Pull 49 cohort capabilities from CreditPool", status: "pending" },
      { id: "tee", label: "Phala TEE: decrypt + LLM underwrite", status: "pending" },
      { id: "attest", label: "Sign with TEE attestation key", status: "pending" },
      { id: "proof", label: "Issue ZK ScoreProof commitment", status: "pending" },
    ];
    setSteps(flow);
    await sleep(540);
    setSteps((s) =>
      setStatus(s, [
        ["cap", "done"],
        ["fetch", "active"],
      ]),
    );
    await sleep(740);
    setSteps((s) =>
      setStatus(s, [
        ["fetch", "done"],
        ["tee", "active"],
      ]),
    );
    await sleep(1200);
    setSteps((s) =>
      setStatus(s, [
        ["tee", "done"],
        ["attest", "active"],
      ]),
    );
    await sleep(420);
    setSteps((s) =>
      setStatus(s, [
        ["attest", "done"],
        ["proof", "active"],
      ]),
    );
    await sleep(620);
    const r = mockUnderwriting(vault.commitment);
    writeResult(r);
    setSteps((s) => setStatus(s, [["proof", "done"]]));
    setRunning(false);
  }

  function reset() {
    writeVault(null);
    writeResult(null);
    writeGraph(null);
    setSteps([]);
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Dashboard
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Your vault.{" "}
          <span className="text-foreground/55">Your terms. Your yield.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Drop a Plaid CSV export. We extract a typed financial graph, encrypt
          the source locally, register a commitment on Midnight, and request
          an attested underwriting from the TEE. The lender gets a ZK proof
          &mdash; never the raw data.
        </p>
      </header>

      {(
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            {!vault ? (
              <Dropzone onFile={handleFile} disabled={running} />
            ) : (
              <VaultCard vault={vault} onReset={reset} />
            )}

            {vault && !result && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
                <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                  Step 2
                </div>
                <div className="text-lg font-medium">
                  Request an underwriting.
                </div>
                <p className="text-sm text-foreground/65">
                  The TEE pulls 49 cohort capabilities, decrypts everything
                  inside the enclave, runs the model, and returns an attested
                  score. Raw transactions never leave the box.
                </p>
                <div>
                  <Button onClick={requestUnderwriting} disabled={running}>
                    {running ? "Running…" : "Run underwriting"}
                  </Button>
                </div>
              </div>
            )}

            {result && <ResultPanel result={result} />}
          </div>

          <div className="flex flex-col gap-6">
            <StepFlow steps={steps} />
            <NetworkLog vault={vault} result={result} />
          </div>
        </div>
      )}
    </div>
  );
}

function VaultCard({
  vault,
  onReset,
}: {
  vault: VaultState;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          Vault registered
        </div>
        <button
          onClick={onReset}
          className="font-mono text-xs text-foreground/50 hover:text-foreground"
        >
          reset
        </button>
      </div>
      <div className="mt-3 text-xl font-medium">{vault.fileName}</div>
      <div className="mt-1 text-sm text-foreground/55">
        {(vault.byteLength / 1024).toFixed(1)} KB · ciphertext local-only
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
        <Field label="Ciphertext hash" value={vault.ciphertextHash} />
        <Field label="Commitment (on chain)" value={vault.commitment} />
        <Field
          label="Policy"
          value={`${vault.policy.queryTypes[0]} · ≤${vault.policy.maxUsesPerWeek}/wk`}
        />
        <Field
          label="Min royalty"
          value={`$${vault.policy.minRoyalty.toFixed(2)} / use`}
        />
      </dl>
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

function NetworkLog({
  vault,
  result,
}: {
  vault: VaultState | null;
  result: UnderwritingResult | null;
}) {
  const rows: { tag: string; body: string }[] = [];
  if (vault) {
    rows.push({
      tag: "POST /encrypt",
      body: `bytes-out=ciphertext(${vault.byteLength}) · plaintext-leaked=0`,
    });
    rows.push({
      tag: "midnight://VaultRegistry.register_vault",
      body: `commitment=${vault.commitment} ok`,
    });
  }
  if (result) {
    rows.push({
      tag: "phala://underwrite",
      body: `attestation=${result.attestation} · score=[redacted from response body]`,
    });
    rows.push({
      tag: "midnight://ScoreProof.issue",
      body: `proof_commitment=${result.reasoningHash}`,
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Network tab (what egresses)
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/55">
          Nothing yet. The interesting moment is what is{" "}
          <span className="text-foreground/80">not</span> in this list.
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
        Zero raw-transaction bytes leave the browser. Verify in DevTools.
      </div>
    </div>
  );
}

function setStatus(
  steps: Step[],
  patches: Array<[string, Step["status"]]>,
): Step[] {
  return steps.map((s) => {
    const hit = patches.find(([id]) => id === s.id);
    return hit ? { ...s, status: hit[1] } : s;
  });
}
