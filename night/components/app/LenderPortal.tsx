"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StepFlow, type Step } from "./StepFlow";
import { shortHash, sleep } from "@/lib/mock";
import { readResult, readVault } from "@/lib/store";
import type { UnderwritingResult } from "@/lib/mock";
import type { VaultState } from "@/lib/store";

type WalletState =
  | { connected: false }
  | { connected: true; addr: string; balance: number };

type Phase = "idle" | "running" | "approved" | "rejected";

export function LenderPortal() {
  const [wallet, setWallet] = useState<WalletState>({ connected: false });
  const [vault, setVault] = useState<VaultState | null>(null);
  const [result, setResult] = useState<UnderwritingResult | null>(null);
  const [amount, setAmount] = useState(2500);
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    setVault(readVault());
    setResult(readResult());
  }, []);

  const threshold = 720;
  const maxLine = useMemo(() => {
    if (!result) return 0;
    const base = Math.max(0, (result.score - 600) * 50);
    return Math.min(15000, base);
  }, [result]);

  async function connectWallet() {
    setPhase("running");
    setSteps([
      { id: "wc1", label: "Open Midnight DApp Wallet popup", status: "active" },
      { id: "wc2", label: "Sign challenge for session key", status: "pending" },
    ]);
    await sleep(600);
    setSteps((s) =>
      s.map((x) =>
        x.id === "wc1"
          ? { ...x, status: "done" }
          : x.id === "wc2"
          ? { ...x, status: "active" }
          : x,
      ),
    );
    await sleep(550);
    setWallet({
      connected: true,
      addr: shortHash(`wallet:${Date.now()}`),
      balance: 12.4,
    });
    setSteps((s) => s.map((x) => ({ ...x, status: "done" })));
    setPhase("idle");
  }

  async function submitProof() {
    if (!result) return;
    setPhase("running");
    setTxHash(null);
    const flow: Step[] = [
      { id: "pull", label: "Pull ScoreProof from vault session", status: "active" },
      { id: "verify", label: "Lender contract verifies ZK proof", status: "pending" },
      { id: "risk", label: "Check internal risk policy (LTV/cap)", status: "pending" },
      { id: "transfer", label: "Disburse mock USDC to borrower", status: "pending" },
    ];
    setSteps(flow);
    await sleep(560);
    setSteps((s) =>
      s.map((x) =>
        x.id === "pull"
          ? { ...x, status: "done" }
          : x.id === "verify"
          ? { ...x, status: "active" }
          : x,
      ),
    );
    await sleep(900);
    const passes = result.score >= threshold && result.debtServiceRatio <= 0.35;
    setSteps((s) =>
      s.map((x) =>
        x.id === "verify"
          ? { ...x, status: "done" }
          : x.id === "risk"
          ? { ...x, status: "active" }
          : x,
      ),
    );
    await sleep(620);
    if (!passes || amount > maxLine) {
      setPhase("rejected");
      setSteps((s) =>
        s.map((x) =>
          x.id === "risk"
            ? { ...x, status: "done" }
            : x.id === "transfer"
            ? { ...x, status: "pending" }
            : x,
        ),
      );
      return;
    }
    setSteps((s) =>
      s.map((x) =>
        x.id === "risk"
          ? { ...x, status: "done" }
          : x.id === "transfer"
          ? { ...x, status: "active" }
          : x,
      ),
    );
    await sleep(800);
    setTxHash(shortHash(`tx:${Date.now()}`));
    setSteps((s) =>
      s.map((x) => (x.id === "transfer" ? { ...x, status: "done" } : x)),
    );
    setPhase("approved");
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          Mock DeFi lender
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
          Borrow USDC against a proof.{" "}
          <span className="text-foreground/55">Not a history.</span>
        </h1>
        <p className="max-w-2xl text-foreground/65">
          The lender contract verifies a Midnight ZK ScoreProof and disburses
          mock USDC. No bank statement, no transactions, no off-chain trust.
        </p>
      </header>

      {!result || !vault ? (
        <EmptyStateNoResult />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <WalletCard
              wallet={wallet}
              onConnect={connectWallet}
              connecting={phase === "running" && !wallet.connected}
            />

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                Proof on file
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
                <Stat label="Predicate" value={`score ≥ ${threshold}`} />
                <Stat
                  label="DSR predicate"
                  value={`≤ ${(0.35 * 100).toFixed(0)}%`}
                />
                <Stat label="Cohort min" value="40" />
                <Stat label="Attestation" value={result.attestation} />
              </div>
              <div className="mt-4 text-xs text-foreground/55">
                The actual score, bucket, and reasoning never leave the TEE.
                The lender only checks the predicates.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                    Request a loan
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <div className="text-5xl font-semibold tabular-nums tracking-tight">
                      ${amount.toLocaleString()}
                    </div>
                    <div className="mb-2 font-mono text-xs text-foreground/55">
                      mock USDC
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-foreground/55">
                  <div>Max line</div>
                  <div className="font-mono text-foreground/85">
                    ${maxLine.toLocaleString()}
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={500}
                max={Math.max(500, maxLine)}
                step={100}
                value={Math.min(amount, Math.max(500, maxLine))}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-6 w-full accent-[var(--accent-strong)]"
              />
              <div className="mt-3 flex items-center justify-between font-mono text-xs text-foreground/45">
                <span>$500</span>
                <span>${maxLine.toLocaleString()}</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={submitProof}
                  disabled={!wallet.connected || phase === "running"}
                  size="lg"
                >
                  {phase === "running" ? "Verifying…" : "Submit proof & borrow"}
                </Button>
                <Link
                  href="/app/vault"
                  className="self-center text-sm text-foreground/65 hover:text-foreground"
                >
                  ← Back to vault
                </Link>
              </div>
            </div>

            {phase === "approved" && txHash && (
              <ApprovedCard amount={amount} txHash={txHash} addr={wallet.connected ? wallet.addr : ""} />
            )}
            {phase === "rejected" && (
              <RejectedCard
                reason={
                  result.score < threshold
                    ? "Score below threshold"
                    : amount > maxLine
                    ? "Requested amount exceeds risk-policy cap"
                    : "Debt service ratio above tolerance"
                }
              />
            )}
          </div>

          <div className="flex flex-col gap-6">
            <StepFlow steps={steps} />
            <PoolStats />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyStateNoResult() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        No underwriting on file
      </div>
      <div className="mt-3 text-xl font-medium">
        Underwrite a vault first, then come back.
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/65">
        The lender wants a ZK ScoreProof. It is produced inside the TEE during
        underwriting. Once you have one, you can borrow against it here.
      </p>
      <div className="mt-6">
        <Button href="/app/vault" size="lg">
          Open the vault →
        </Button>
      </div>
    </div>
  );
}

function WalletCard({
  wallet,
  onConnect,
  connecting,
}: {
  wallet: WalletState;
  onConnect: () => void;
  connecting: boolean;
}) {
  if (!wallet.connected) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              Wallet
            </div>
            <div className="mt-2 text-lg font-medium">
              Connect Midnight DApp Wallet
            </div>
            <p className="mt-1 text-sm text-foreground/55">
              The lender needs a destination address before disbursing.
            </p>
          </div>
          <Button onClick={onConnect} disabled={connecting} size="md">
            {connecting ? "Connecting…" : "Connect"}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Wallet connected
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-sm text-foreground/85">
            {wallet.addr}
          </div>
          <div className="mt-1 text-xs text-foreground/55">
            Session key derived. No persistent secret stored.
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-foreground/45">
            Pool reserves
          </div>
          <div className="text-xl font-semibold tabular-nums">${(wallet.balance * 1_000_000).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-foreground/40">
        {label}
      </div>
      <div className="mt-0.5 truncate text-foreground/85">{value}</div>
    </div>
  );
}

function ApprovedCard({
  amount,
  txHash,
  addr,
}: {
  amount: number;
  txHash: string;
  addr: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-6"
    >
      <div className="font-mono text-xs uppercase tracking-widest text-emerald-300/80">
        Disbursed
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-5xl font-semibold tabular-nums tracking-tight">
          ${amount.toLocaleString()}
        </div>
        <div className="mb-2 font-mono text-xs text-foreground/55">
          mock USDC
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 font-mono text-xs sm:grid-cols-2">
        <Stat label="Recipient" value={addr} />
        <Stat label="Tx" value={txHash} />
      </div>
    </motion.div>
  );
}

function RejectedCard({ reason }: { reason: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6"
    >
      <div className="font-mono text-xs uppercase tracking-widest text-amber-300/80">
        Rejected
      </div>
      <div className="mt-2 text-lg font-medium">{reason}</div>
      <p className="mt-2 text-sm text-foreground/65">
        The lender contract refused to disburse. No transaction was emitted.
        Adjust the amount or revise policy.
      </p>
    </motion.div>
  );
}

function PoolStats() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Pool snapshot
      </div>
      <ul className="mt-4 flex flex-col gap-2 font-mono text-xs">
        <Row k="Reserves (USDC)" v="$12,400,000" />
        <Row k="Active borrowers" v="318" />
        <Row k="Avg score (cohort)" v="742" />
        <Row k="Default rate (90d)" v="1.8%" />
        <Row k="Cohort size / underwriting" v="50" />
      </ul>
      <p className="mt-4 text-xs text-foreground/45">
        Snapshot is illustrative — figures are not pulled from a real pool yet.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-foreground/55">{k}</span>
      <span className="text-foreground/90">{v}</span>
    </li>
  );
}
