"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/mezo/contracts";
import { CROSS_CHAIN_SOURCES, MEZO_BRIDGE_URL } from "@/lib/mezo/crosschain";

function fmt(raw: bigint, decimals: number) {
  const n = Number(formatUnits(raw, decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// Flat list so balances batch into one multicall per chain.
const ENTRIES = CROSS_CHAIN_SOURCES.flatMap((src) =>
  src.tokens.map((token) => ({ src, token })),
);

export function CrossChainPanel() {
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: ENTRIES.map((e) => ({
      address: e.token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: e.src.chainId,
    })),
    query: { enabled: Boolean(address) },
  });

  const holdings = ENTRIES.map((e, i) => {
    const res = data?.[i];
    const raw = res?.status === "success" ? (res.result as unknown as bigint) : BigInt(0);
    return { ...e, raw };
  }).filter((h) => h.raw > BigInt(0));

  const byChain = CROSS_CHAIN_SOURCES.map((src) => ({
    src,
    rows: holdings.filter((h) => h.src.chainId === src.chainId),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Assets on other chains</h2>
        <span className="font-mono text-xs text-foreground/45">read-only</span>
      </div>
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Steward reads your Bitcoin-backed assets and stablecoins on Ethereum and
        Base. Bring them to Mezo to borrow against them and fund an agent. Custody
        stays with you; bridging runs through Mezo&apos;s own bridge.
      </p>

      {isLoading && (
        <div className="mt-6 text-sm text-foreground/50">Reading balances across chains…</div>
      )}

      {!isLoading && byChain.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-background/60 p-5 text-sm leading-6 text-foreground/60">
          No bridgeable assets found on Ethereum or Base for this wallet. WBTC,
          tBTC, cbBTC and USDC will show here when present.
        </div>
      )}

      {!isLoading &&
        byChain.map((group) => (
          <div key={group.src.chainId} className="mt-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
                {group.src.name}
              </span>
              <a
                href={MEZO_BRIDGE_URL}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] uppercase tracking-widest text-foreground/55 underline-offset-4 hover:text-foreground hover:underline"
              >
                Bridge to Mezo ↗
              </a>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              {group.rows.map((row, idx) => (
                <div
                  key={row.token.symbol}
                  className={`grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 ${
                    idx > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-foreground">{row.token.symbol}</span>
                    <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/45">
                      {row.token.kind === "btc" ? "Bitcoin" : "Stable"}
                    </span>
                  </div>
                  <span className="font-mono text-sm text-foreground">
                    {fmt(row.raw, row.token.decimals)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
