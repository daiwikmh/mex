"use client";

import { useEffect, useState } from "react";
import { isAddress, maxUint256, parseUnits, type Address } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/Button";
import { activeChain, TESTNET_VAULT_CHAIN } from "@/lib/mezo/config";
import {
  BRIDGE_OUTBOX,
  bridgeOutboxAbi,
  erc20Abi,
  tokensFor,
} from "@/lib/mezo/contracts";

const DEST = TESTNET_VAULT_CHAIN; // Base Sepolia

export function BridgePanel() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const musd = tokensFor(activeChain.id).musd;

  const onMezo = chainId === activeChain.id;
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    if (address && !recipient) setRecipient(address);
  }, [address, recipient]);

  const { data: allowance, refetch } = useReadContract({
    address: musd,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && BRIDGE_OUTBOX ? [address, BRIDGE_OUTBOX] : undefined,
    chainId: activeChain.id,
    query: { enabled: Boolean(address && musd && BRIDGE_OUTBOX) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const amountWei = amount && Number(amount) > 0 ? parseUnits(amount, 18) : BigInt(0);
  const needsApproval =
    allowance != null && amountWei > BigInt(0) && (allowance as bigint) < amountWei;
  const valid = amountWei > BigInt(0) && isAddress(recipient) && Boolean(musd && BRIDGE_OUTBOX);
  const busy = isPending || confirming;

  function approve() {
    if (!musd) return;
    writeContract({
      address: musd,
      abi: erc20Abi,
      functionName: "approve",
      args: [BRIDGE_OUTBOX as Address, maxUint256],
    });
  }

  function bridge() {
    writeContract({
      address: BRIDGE_OUTBOX as Address,
      abi: bridgeOutboxAbi,
      functionName: "lock",
      args: [amountWei, BigInt(DEST.id), recipient as Address],
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Bridge MUSD to {DEST.name}</h2>
        <span className="font-mono text-xs text-foreground/45">StewardBridge · demo</span>
      </div>
      <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/70">
        Lock MUSD on Mezo; the relayer mints bridged MUSD (bMUSD) to your recipient
        on {DEST.name}, ready to deploy into a testnet vault. This is a trusted demo
        bridge (single relayer) — testnet only.
      </p>

      {!BRIDGE_OUTBOX && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-background/60 p-5 text-sm text-foreground/60">
          Bridge not configured. Set <code className="font-mono">NEXT_PUBLIC_BRIDGE_OUTBOX</code>.
        </div>
      )}

      {BRIDGE_OUTBOX && !onMezo && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-dashed border-border bg-background/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-foreground/70">
            Locking happens on {activeChain.name}. Switch your wallet to continue.
          </span>
          <Button onClick={() => switchChain({ chainId: activeChain.id })} disabled={switching}>
            {switching ? "Switching…" : `Switch to ${activeChain.name}`}
          </Button>
        </div>
      )}

      {BRIDGE_OUTBOX && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MUSD to bridge" hint="locked on Mezo" value={amount} onChange={(v) => setAmount(v.replace(/[^0-9.]/g, ""))} placeholder="10" />
            <Field label={`Recipient on ${DEST.name}`} hint="who receives bMUSD" value={recipient} onChange={setRecipient} placeholder="0x…" />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {needsApproval ? (
              <Button onClick={approve} size="lg" disabled={!valid || busy || !onMezo}>
                {busy ? "Approving…" : "Approve MUSD"}
              </Button>
            ) : (
              <Button onClick={bridge} size="lg" disabled={!valid || busy || !onMezo}>
                {isPending ? "Confirm in wallet…" : confirming ? "Locking…" : "Bridge MUSD"}
              </Button>
            )}
            <span className="text-xs text-foreground/55">
              Funds lock on Mezo; bMUSD mints on {DEST.name} after the relayer confirms.
            </span>
          </div>

          {isSuccess && !needsApproval && (
            <p className="mt-4 font-mono text-xs text-accent">
              Locked on Mezo. The relayer will mint bMUSD on {DEST.name}.
            </p>
          )}
          {error && (
            <p className="mt-4 max-w-lg font-mono text-xs text-[#b3492f]">
              {(error as { shortMessage?: string }).shortMessage ?? error.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-foreground/60">{label}</span>
        <span className="text-[11px] text-foreground/45">{hint}</span>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-lg text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}
