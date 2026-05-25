"use client";

import { useEffect, useState } from "react";
import { formatUnits, maxUint256, parseUnits, type Address } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/Button";
import { useVaultNetwork } from "@/components/mezo/network";
import { erc20Abi } from "@/lib/mezo/contracts";
import { VAULTS, type VaultApy } from "@/lib/mezo/vaults";
import { TESTNET_VAULT_CHAIN } from "@/lib/mezo/config";
import {
  AAVE_BASE_SEPOLIA,
  TESTNET_VAULTS,
  aaveDataProviderAbi,
  aavePoolAbi,
  rayToApr,
  type TestnetVault,
} from "@/lib/mezo/aaveTestnet";

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

function fmtAmount(raw: bigint, decimals: number) {
  const n = Number(formatUnits(raw, decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function VaultsPanel() {
  const { network } = useVaultNetwork();
  return network === "testnet" ? <TestnetVaults /> : <MainnetVaults />;
}

// ---------------------------------------------------------------------------
// Mainnet: read-only Aave positions + live APY from DeFiLlama.
// ---------------------------------------------------------------------------

const CHAINS = Array.from(new Set(VAULTS.map((v) => v.chainName)));

function MainnetVaults() {
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
    return {
      v,
      apy: apys[v.id]?.apy ?? null,
      tvl: apys[v.id]?.tvlUsd ?? null,
      pos: raw > BigInt(0) ? fmtAmount(raw, v.decimals) : null,
    };
  });

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Yield vaults on other chains</h2>
        <span className="font-mono text-xs text-foreground/45">mainnet · read-only</span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
        Venues a Steward could deploy idle capital into, across chains. APYs are
        live from DeFiLlama; positions read from your wallet. Switch to Testnet in
        the sidebar to actually deposit and withdraw.
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

// ---------------------------------------------------------------------------
// Testnet: real Aave v3 on Base Sepolia — live APR + deposit/withdraw.
// ---------------------------------------------------------------------------

function TestnetVaults() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const onChain = chainId === TESTNET_VAULT_CHAIN.id;

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Testnet vaults · Base Sepolia</h2>
        <span className="font-mono text-xs text-foreground/45">live · real deposits</span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
        Real Aave v3 markets on Base Sepolia. Deposit and withdraw actually run on
        chain. Get test tokens from the{" "}
        <a
          href={AAVE_BASE_SEPOLIA.faucetUrl}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline-offset-4 hover:underline"
        >
          Aave faucet ↗
        </a>
        .
      </p>

      {!onChain && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-background/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-foreground/70">
            Your wallet is on another network. Switch to Base Sepolia to deposit and withdraw.
          </span>
          <Button onClick={() => switchChain({ chainId: TESTNET_VAULT_CHAIN.id })} disabled={switching}>
            {switching ? "Switching…" : "Switch to Base Sepolia"}
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {TESTNET_VAULTS.map((v) => (
          <TestnetVaultRow key={v.id} vault={v} owner={address} onChain={onChain} />
        ))}
      </div>
    </div>
  );
}

function TestnetVaultRow({
  vault,
  owner,
  onChain,
}: {
  vault: TestnetVault;
  owner?: Address;
  onChain: boolean;
}) {
  const cid = TESTNET_VAULT_CHAIN.id;
  const [amount, setAmount] = useState("");

  const { data: reserve } = useReadContract({
    address: AAVE_BASE_SEPOLIA.dataProvider,
    abi: aaveDataProviderAbi,
    functionName: "getReserveData",
    args: [vault.underlying],
    chainId: cid,
  });
  const { data: position } = useReadContract({
    address: vault.aToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    chainId: cid,
    query: { enabled: Boolean(owner) },
  });
  const { data: walletBal } = useReadContract({
    address: vault.underlying,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    chainId: cid,
    query: { enabled: Boolean(owner) },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: vault.underlying,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner ? [owner, AAVE_BASE_SEPOLIA.pool] : undefined,
    chainId: cid,
    query: { enabled: Boolean(owner) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) refetchAllowance();
  }, [isSuccess, refetchAllowance]);

  const apr = reserve ? rayToApr((reserve as unknown as bigint[])[5]) : null;
  const posStr = position != null ? fmtAmount(position as unknown as bigint, vault.decimals) : "—";
  const availStr = walletBal != null ? fmtAmount(walletBal as unknown as bigint, vault.decimals) : "—";
  const amountWei = amount && Number(amount) > 0 ? parseUnits(amount, vault.decimals) : BigInt(0);
  const needsApproval =
    allowance != null && amountWei > BigInt(0) && (allowance as unknown as bigint) < amountWei;
  const busy = isPending || confirming;
  const canAct = onChain && amountWei > BigInt(0) && !busy;

  function deposit() {
    if (needsApproval) {
      writeContract({
        address: vault.underlying,
        abi: erc20Abi,
        functionName: "approve",
        args: [AAVE_BASE_SEPOLIA.pool, maxUint256],
      });
      return;
    }
    writeContract({
      address: AAVE_BASE_SEPOLIA.pool,
      abi: aavePoolAbi,
      functionName: "supply",
      args: [vault.underlying, amountWei, owner as Address, 0],
    });
  }

  function withdraw() {
    if (!owner) return;
    writeContract({
      address: AAVE_BASE_SEPOLIA.pool,
      abi: aavePoolAbi,
      functionName: "withdraw",
      args: [vault.underlying, amountWei, owner],
    });
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm text-foreground">Aave v3</span>
          <span className="font-mono text-sm text-foreground/70">{vault.asset}</span>
          <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/45">
            {vault.kind === "btc" ? "Bitcoin" : "Stable"}
          </span>
        </div>
        <div className="flex items-center gap-5 font-mono text-xs text-foreground/55">
          <span>APR <span className="text-accent">{pctApy(apr)}</span></span>
          <span>Supplied <span className="text-foreground">{posStr}</span></span>
          <span>Wallet <span className="text-foreground">{availStr}</span></span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={`Amount (${vault.asset})`}
          className="h-11 flex-1 rounded-xl border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <Button onClick={deposit} size="sm" disabled={!canAct}>
            {busy ? "…" : needsApproval ? "Approve" : "Deposit"}
          </Button>
          <Button onClick={withdraw} variant="secondary" size="sm" disabled={!canAct}>
            Withdraw
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 font-mono text-xs text-[#b3492f]">
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}
    </div>
  );
}
