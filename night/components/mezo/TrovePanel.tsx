"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseEther, parseUnits, zeroAddress, type Address } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/Button";
import {
  borrowerOperationsAbi,
  erc20Abi,
  mezoContractsFor,
  MUSD_GAS_COMPENSATION,
  priceFeedAbi,
  tokensFor,
  troveManagerAbi,
} from "@/lib/mezo/contracts";

const WAD = BigInt("1000000000000000000");
const Z = zeroAddress;

function num(v: bigint, dp = 18, max = 4) {
  return Number(formatUnits(v, dp)).toLocaleString(undefined, { maximumFractionDigits: max });
}

export function TrovePanel() {
  const { address } = useAccount();
  const chainId = useChainId();
  const c = mezoContractsFor(chainId);
  const musd = tokensFor(chainId).musd;

  const { data: debt, refetch: rDebt } = useReadContract({
    address: c?.troveManager,
    abi: troveManagerAbi,
    functionName: "getTroveDebt",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(c && address) },
  });
  const { data: coll, refetch: rColl } = useReadContract({
    address: c?.troveManager,
    abi: troveManagerAbi,
    functionName: "getTroveColl",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(c && address) },
  });
  const { data: mcr } = useReadContract({
    address: c?.troveManager,
    abi: troveManagerAbi,
    functionName: "MCR",
    query: { enabled: Boolean(c) },
  });
  const { data: price } = useReadContract({
    address: c?.priceFeed,
    abi: priceFeedAbi,
    functionName: "fetchPrice",
    query: { enabled: Boolean(c) },
  });
  const { data: musdBal, refetch: rBal } = useReadContract({
    address: musd,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(musd && address) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      rDebt();
      rColl();
      rBal();
    }
  }, [isSuccess, rDebt, rColl, rBal]);

  const [addAmt, setAddAmt] = useState("");
  const [wdAmt, setWdAmt] = useState("");
  const [repayAmt, setRepayAmt] = useState("");
  const [borrowAmt, setBorrowAmt] = useState("");

  if (!c) return null;

  const debtV = (debt as bigint) ?? BigInt(0);
  const collV = (coll as bigint) ?? BigInt(0);
  const hasTrove = debtV > BigInt(0) && collV > BigInt(0);
  const busy = isPending || confirming;

  if (!hasTrove) {
    return (
      <Card title="Your position" hint="trove">
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          No open trove. Borrow MUSD above to open one — it will appear here with
          live health and management actions.
        </p>
      </Card>
    );
  }

  const priceV = (price as bigint) ?? BigInt(0);
  const mcrV = (mcr as bigint) ?? BigInt("1100000000000000000");
  const balV = (musdBal as bigint) ?? BigInt(0);

  const collUsd = priceV > BigInt(0) ? (collV * priceV) / WAD : BigInt(0);
  const icrPct = debtV > BigInt(0) ? Number((collUsd * BigInt(10000)) / debtV) / 100 : 0;
  const liqPrice = collV > BigInt(0) ? (debtV * mcrV) / collV : BigInt(0);
  const mcrPct = Number(mcrV) / 1e16; // 1.1e18 -> 110

  const closeNeeded = debtV > MUSD_GAS_COMPENSATION ? debtV - MUSD_GAS_COMPENSATION : BigInt(0);
  const canClose = balV >= closeNeeded;

  const healthColor = icrPct >= mcrPct * 1.5 ? "text-accent" : icrPct >= mcrPct * 1.15 ? "text-foreground" : "text-[#b3492f]";

  function send(
    fn: "addColl" | "withdrawColl" | "repayMUSD" | "withdrawMUSD" | "closeTrove",
    amount?: bigint,
    value?: bigint,
  ) {
    if (!c) return;
    const base = { address: c.borrowerOperations, abi: borrowerOperationsAbi } as const;
    if (fn === "closeTrove") {
      writeContract({ ...base, functionName: "closeTrove", args: [] });
    } else if (fn === "addColl") {
      writeContract({ ...base, functionName: "addColl", args: [Z, Z], value });
    } else {
      writeContract({ ...base, functionName: fn, args: [amount as bigint, Z, Z] });
    }
  }

  return (
    <Card title="Your position" hint="trove">
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Collateral" value={`${num(collV)} BTC`} sub={`$${num(collUsd, 18, 0)}`} />
        <Stat label="Debt" value={`${num(debtV, 18, 2)} MUSD`} />
        <Stat label="Coll. ratio" value={`${icrPct.toFixed(1)}%`} sub={`min ${mcrPct.toFixed(0)}%`} valueClass={healthColor} />
        <Stat label="Liquidation @" value={`$${num(liqPrice, 18, 0)}`} sub={`BTC $${num(priceV, 18, 0)}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Action label="Add collateral" unit="BTC" value={addAmt} onChange={setAddAmt} disabled={busy}
          onSubmit={() => send("addColl", undefined, parseEther(addAmt || "0"))} cta="Add" />
        <Action label="Withdraw collateral" unit="BTC" value={wdAmt} onChange={setWdAmt} disabled={busy}
          onSubmit={() => send("withdrawColl", parseEther(wdAmt || "0"))} cta="Withdraw" />
        <Action label="Repay MUSD" unit="MUSD" value={repayAmt} onChange={setRepayAmt} disabled={busy}
          onSubmit={() => send("repayMUSD", parseUnits(repayAmt || "0", 18))} cta="Repay" />
        <Action label="Borrow more MUSD" unit="MUSD" value={borrowAmt} onChange={setBorrowAmt} disabled={busy}
          onSubmit={() => send("withdrawMUSD", parseUnits(borrowAmt || "0", 18))} cta="Borrow" />
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-foreground/70">
          Close trove — repay {num(closeNeeded, 18, 2)} MUSD, reclaim all collateral.
          <span className="ml-1 font-mono text-xs text-foreground/45">
            (you hold {num(balV, 18, 2)})
          </span>
        </div>
        <Button onClick={() => send("closeTrove")} variant="secondary" disabled={busy || !canClose}>
          {canClose ? "Close trove" : "Not enough MUSD"}
        </Button>
      </div>

      {isSuccess && <p className="mt-4 font-mono text-xs text-accent">Position updated.</p>}
      {error && (
        <p className="mt-4 max-w-lg font-mono text-xs text-[#b3492f]">
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}
    </Card>
  );
}

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">{title}</h2>
        <span className="font-mono text-xs text-foreground/45">{hint}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClass = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">{label}</div>
      <div className={`mt-1 font-serif text-xl tracking-tight ${valueClass}`}>{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-foreground/45">{sub}</div>}
    </div>
  );
}

function Action({
  label,
  unit,
  value,
  onChange,
  onSubmit,
  cta,
  disabled,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  cta: string;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/55">{label}</div>
      <div className="mt-2 flex gap-2">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder={`0.0 ${unit}`}
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-accent"
        />
        <Button onClick={onSubmit} size="sm" variant="secondary" disabled={disabled || !(Number(value) > 0)}>
          {cta}
        </Button>
      </div>
    </div>
  );
}
