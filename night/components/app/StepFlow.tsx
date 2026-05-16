"use client";

import { AnimatePresence, motion } from "motion/react";

export type Step = {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
};

export function StepFlow({ steps }: { steps: Step[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Pipeline
      </div>
      {steps.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/55">
          Steps appear as the flow runs. Start by dropping a statement.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {steps.map((s) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                  s.status === "done"
                    ? "border-emerald-500/30 bg-emerald-500/[0.06] text-foreground"
                    : s.status === "active"
                    ? "border-accent-strong/40 bg-accent-strong/[0.08] text-foreground"
                    : "border-border bg-surface-2 text-foreground/55"
                }`}
              >
                <StatusDot status={s.status} />
                <span>{s.label}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: Step["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/80 text-[10px] text-background">
        ✓
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative flex h-4 w-4 items-center justify-center">
        <span className="absolute h-4 w-4 animate-ping rounded-full bg-accent-strong/40" />
        <span className="relative h-2 w-2 rounded-full bg-accent-strong" />
      </span>
    );
  }
  return <span className="h-2 w-2 rounded-full bg-foreground/30" />;
}
