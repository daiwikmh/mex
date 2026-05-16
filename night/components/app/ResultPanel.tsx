"use client";

import { motion } from "motion/react";
import type { UnderwritingResult } from "@/lib/mock";
import { Button } from "@/components/ui/Button";

export function ResultPanel({ result }: { result: UnderwritingResult }) {
  const tier =
    result.score >= 780
      ? { label: "Prime", tone: "emerald" }
      : result.score >= 720
      ? { label: "Near-prime", tone: "accent" }
      : { label: "Subprime, within tolerance", tone: "amber" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
            Attested underwriting
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-6xl font-semibold tracking-tight tabular-nums">
              {result.score}
            </div>
            <div
              className={`mb-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs ${
                tier.tone === "emerald"
                  ? "border-emerald-500/30 text-emerald-300"
                  : tier.tone === "accent"
                  ? "border-accent-strong/40 text-accent"
                  : "border-amber-500/30 text-amber-300"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {tier.label}
            </div>
          </div>
        </div>
        <Button href="/app/lend" size="sm" variant="secondary">
          Send proof to lender →
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
        <Stat label="Income bucket" value={result.monthlyIncomeBucket} />
        <Stat
          label="Debt service ratio"
          value={`${(result.debtServiceRatio * 100).toFixed(0)}%`}
        />
        <Stat label="Cohort size" value={`${result.cohortSize}`} />
        <Stat label="Attestation" value={result.attestation} />
      </dl>

      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4 text-xs text-foreground/65">
        <div className="font-mono uppercase tracking-widest text-foreground/40">
          What the lender will see
        </div>
        <p className="mt-2 leading-6">
          A zero-knowledge proof that{" "}
          <span className="text-foreground/90">score ≥ 720</span>,{" "}
          <span className="text-foreground/90">DSR ≤ 35%</span>,{" "}
          <span className="text-foreground/90">cohort_size ≥ 40</span>, signed
          by the TEE attestation key. Nothing else. Not the score itself, not
          the bucket, not a single transaction.
        </p>
      </div>
    </motion.div>
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
