"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { readQueries, type QueryReceipt } from "@/lib/agents";

export default function ActivityPage() {
  const [queries, setQueries] = useState<QueryReceipt[]>([]);

  useEffect(() => {
    setQueries(readQueries());
    const refresh = () => setQueries(readQueries());
    window.addEventListener("nocturne:queries-change", refresh);
    return () => window.removeEventListener("nocturne:queries-change", refresh);
  }, []);

  const sorted = [...queries].sort((a, b) => b.ts - a.ts);
  const totalSpend = queries.reduce((s, q) => s + q.paymentUsd, 0);

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Activity
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Every query the agent ran.{" "}
          <span className="text-foreground/55">Receipts, not promises.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          A live view of authorized queries against the agent&apos;s policy.
          Each entry is a Midnight transaction with a hash of the request and
          a commitment to the result.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Queries"        value={String(queries.length)} />
        <Stat label="Total spend"    value={`$${totalSpend.toFixed(2)}`} />
        <Stat label="Allowed"        value={String(queries.filter((q) => q.allowed).length)} />
        <Stat label="Rejected"       value={String(queries.filter((q) => !q.allowed).length)} />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-foreground/15 bg-surface p-6 font-mono text-sm text-foreground/55">
          No queries yet. Run one on the Agents page.
        </div>
      ) : (
        <ol className="space-y-3">
          {sorted.map((q) => (
            <li
              key={q.queryHash}
              className="rounded-2xl border border-foreground/15 bg-surface p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/55">
                  Query receipt
                </div>
                <div className="font-mono text-[10px] text-foreground/45">
                  {new Date(q.ts).toLocaleString()}
                </div>
              </div>
              <div className="mt-1.5 text-base font-medium text-foreground">
                {q.queryLabel}
              </div>
              <div className="mt-1 text-sm text-foreground/70">
                {q.allowed ? "Authorized + executed in TEE" : "Rejected at policy check"}
                {" · "}payment ${q.paymentUsd.toFixed(2)}
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
                <Field label="query hash"        value={q.queryHash} />
                <Field label="result commitment" value={q.resultCommitment} />
                <Field label="tx"                value={q.txHash ?? "—"} />
                <Field label="agent"             value={q.agentId} />
              </dl>
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
