"use client";

import { useMemo } from "react";
import type { VaultState } from "@/lib/store";
import { shortHash } from "@/lib/mock";

type Usage = {
  ts: string;
  agent: string;
  queryType: string;
  cohortSize: number;
  royalty: number;
};

export function ContributorPanel({ vault }: { vault: VaultState | null }) {
  const usages = useMemo<Usage[]>(() => {
    if (!vault) return [];
    const seed = vault.commitment;
    const days = 14;
    const out: Usage[] = [];
    for (let i = 0; i < days; i++) {
      const n = (parseInt(shortHash(`${seed}:day${i}`).slice(2, 4), 16) % 3) + 1;
      for (let j = 0; j < n; j++) {
        const r =
          0.45 + (parseInt(shortHash(`${seed}:r${i}${j}`).slice(2, 6), 16) % 80) / 100;
        out.push({
          ts: new Date(Date.now() - i * 86400000 - j * 7200000).toISOString(),
          agent: shortHash(`agent:${i}${j}`).slice(0, 10),
          queryType: "credit-score-v1",
          cohortSize: 50,
          royalty: Math.round(r * 100) / 100,
        });
      }
    }
    return out;
  }, [vault]);

  const totalEarned = usages.reduce((s, u) => s + u.royalty, 0);

  if (!vault) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          Earnings tab
        </div>
        <div className="mt-3 text-xl font-medium">
          No vault yet. Register one to start earning.
        </div>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground/65">
          When your statement joins the cohort, every underwriting that draws
          from your slice pays a royalty privately to your wallet on Midnight.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
            14-day earnings
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-5xl font-semibold tabular-nums tracking-tight">
              ${totalEarned.toFixed(2)}
            </div>
            <div className="mb-2 text-sm text-foreground/55">
              private royalties
            </div>
          </div>
          <div className="mt-3 text-sm text-foreground/65">
            {usages.length} queries served · cohort size {vault.policy.queryTypes[0] ? 50 : 0}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
            Policy
          </div>
          <div className="mt-3 flex flex-col gap-2 font-mono text-xs">
            <Row k="Query types" v={vault.policy.queryTypes.join(", ")} />
            <Row k="Max uses / week" v={`${vault.policy.maxUsesPerWeek}`} />
            <Row k="Min royalty / use" v={`$${vault.policy.minRoyalty.toFixed(2)}`} />
            <Row k="Status" v="opted in" />
          </div>
          <div className="mt-4 text-xs text-foreground/55">
            Policy edits issue a new commitment and revoke the old one. Active
            authorizations expire on next rotation.
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
            Attested usage log
          </div>
          <p className="mt-1 text-sm text-foreground/55">
            Every row signed by the TEE that issued the score. Cohort members
            stay private to outside parties.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {usages.slice(0, 12).map((u, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 px-6 py-3 font-mono text-xs"
            >
              <span className="w-32 truncate text-foreground/55">
                {new Date(u.ts).toLocaleDateString()} ·{" "}
                {new Date(u.ts).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="flex-1 truncate text-foreground/85">
                agent {u.agent}
              </span>
              <span className="hidden text-foreground/55 sm:inline">
                {u.queryType}
              </span>
              <span className="tabular-nums text-emerald-300">
                +${u.royalty.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-foreground/55">{k}</span>
      <span className="truncate text-foreground/90">{v}</span>
    </div>
  );
}
