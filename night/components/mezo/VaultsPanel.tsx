"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/mezo/contracts";
import { VAULTS, type VaultApy } from "@/lib/mezo/vaults";

function pctApy(apy: number | null) {
  return apy == null ? "—" : `${apy.toFixed(2)}%`;
}

function shortUsd(tvl: number | null) {
  if (tvl == null) return "—";
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}

function position(raw: bigint, decimals: number) {
  if (raw === BigInt(0)) return null;
  const n = Number(formatUnits(raw, decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

const CHAINS = Array.from(new Set(VAULTS.map((v) => v.chainName)));

export function VaultsPanel() {
  const { address } = useAccount();
  const [apys, setApys] = useState<Record<string, VaultApy>>({});
  const [loadingApy, setLoadingApy] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/vaults")
      .then((r) => r.json())
      .then((j: { vaults?: VaultApy[] }) => {
        if (!active) return;
        const m: Record<string, VaultApy> = {};
        (j.vaults ?? []).forEach((v) => (m[v.id] = v));
        setApys(m);
      })
      .catch(() => {})
      .finally(() => active && setLoadingApy(false));
    return () => {
      active = false;
    };
  }, []);

  const { data: balances } = useReadContracts({
    allowFailure: true,
    contracts: VAULTS.map((v) => ({
      address: v.aToken,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: v.chainId,
    })),
    query: { enabled: Boolean(address) },
  });

  const rows = VAULTS.map((v, i) => {
    const res = balances?.[i];
    const raw = res?.status === "success" ? (res.result as unknown as bigint) : BigInt(0);
    return { v, apy: apys[v.id]?.apy ?? null, tvl: apys[v.id]?.tvlUsd ?? null, pos: position(raw, v.decimals) };
  });

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Yield vaults on other chains</h2>
        <span className="font-mono text-xs text-foreground/45">read-only</span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
        Venues a Steward could deploy idle capital into, across chains. APYs are
        live from DeFiLlama; positions read from your wallet. Steward never moves
        funds itself — bridging runs through Mezo and each protocol.
      </p>

      {CHAINS.map((chain) => {
        const group = rows.filter((r) => r.v.chainName === chain);
        return (
          <div key={chain} className="mt-6">
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent">{chain}</span>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1.4fr_auto_auto_auto] gap-4 border-b border-border bg-surface-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-foreground/45">
                <span>Vault</span>
                <span className="text-right">APY</span>
                <span className="text-right">TVL</span>
                <span className="text-right">Your position</span>
              </div>
              {group.map((r, idx) => (
                <div
                  key={r.v.id}
                  className={`grid grid-cols-[1.4fr_auto_auto_auto] items-center gap-4 px-4 py-3 ${
                    idx > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm text-foreground">{r.v.project}</span>
                    <span className="font-mono text-sm text-foreground/70">{r.v.asset}</span>
                    <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/45">
                      {r.v.kind === "btc" ? "Bitcoin" : "Stable"}
                    </span>
                  </div>
                  <span className="text-right font-mono text-sm text-accent">{pctApy(r.apy)}</span>
                  <span className="text-right font-mono text-sm text-foreground/60">{shortUsd(r.tvl)}</span>
                  <span className="text-right font-mono text-sm text-foreground">{r.pos ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {loadingApy && <div className="mt-4 text-xs text-foreground/45">Loading live APYs…</div>}
    </div>
  );
}
