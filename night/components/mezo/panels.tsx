"use client";

import { useState } from "react";
import { formatUnits, parseEther, parseUnits, zeroAddress, type Address } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/mezo/WalletButton";
import { activeChain } from "@/lib/mezo/config";
import {
  BORROWER_OPERATIONS,
  borrowerOperationsAbi,
  erc20Abi,
  tokensFor,
} from "@/lib/mezo/contracts";

function trim(v: string, dp = 6) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString(undefined, { maximumFractionDigits: dp });
}

export function ConnectPrompt() {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-sm">
      <h2 className="font-serif text-2xl text-foreground">Connect a wallet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
        Connect an EVM wallet to {activeChain.name}. Steward reads your BTC and
        MUSD balances directly from the chain.
      </p>
      <div className="mt-6">
        <WalletButton />
      </div>
    </div>
  );
}

export function WrongChainPrompt() {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-sm">
      <h2 className="font-serif text-2xl text-foreground">Switch to {activeChain.name}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
        Your wallet is on another network. Switch to {activeChain.name} (chain id{" "}
        {activeChain.id}) to continue.
      </p>
      <div className="mt-6">
        <WalletButton />
      </div>
    </div>
  );
}

export function BalancesGrid() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: btc } = useBalance({ address });
  const tokens = tokensFor(chainId);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <BalanceCard label="BTC" sub="Native · gas token" value={btc ? trim(btc.formatted) : "—"} />
      {tokens.musd && address ? (
        <TokenBalanceCard label="MUSD" sub="Bitcoin-backed stablecoin" token={tokens.musd} owner={address} />
      ) : (
        <BalanceCard label="MUSD" sub="Not on this network" value="—" />
      )}
      {tokens.mezo && address ? (
        <TokenBalanceCard label="MEZO" sub="Settlement + staking" token={tokens.mezo} owner={address} />
      ) : (
        <BalanceCard label="MEZO" sub="Address not published yet" value="—" />
      )}
    </div>
  );
}

function BalanceCard({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm">
      <span className="font-mono text-xs uppercase tracking-widest text-accent">{label}</span>
      <div className="mt-4 font-serif text-3xl tracking-tight text-foreground">{value}</div>
      <div className="mt-2 text-xs text-foreground/55">{sub}</div>
    </div>
  );
}

function TokenBalanceCard({
  label,
  sub,
  token,
  owner,
}: {
  label: string;
  sub: string;
  token: Address;
  owner: Address;
}) {
  const { data: raw } = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });
  const { data: decimals } = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "decimals",
  });
  const value = raw != null ? trim(formatUnits(raw, decimals ?? 18)) : "…";
  return <BalanceCard label={label} sub={sub} value={value} />;
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
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

function NotWired({ what }: { what: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-background/60 p-5">
      <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/45">
        Not wired yet
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground/65">{what}</p>
    </div>
  );
}

export function BorrowPanel() {
  const { address } = useAccount();
  const { data: btc } = useBalance({ address });
  const btcAvailable = btc ? btc.formatted : "0";

  const [collateral, setCollateral] = useState("");
  const [debt, setDebt] = useState("");
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const enabled = Boolean(BORROWER_OPERATIONS);
  const canSubmit =
    enabled && Number(collateral) > 0 && Number(debt) > 0 && !isPending && !confirming;

  function submit() {
    if (!BORROWER_OPERATIONS) return;
    writeContract({
      address: BORROWER_OPERATIONS,
      abi: borrowerOperationsAbi,
      functionName: "openTrove",
      args: [parseUnits(debt, 18), zeroAddress, zeroAddress],
      value: parseEther(collateral),
    });
  }

  return (
    <Panel title="Borrow MUSD" hint="openTrove">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Deposit BTC as collateral and mint MUSD against it. Collateral is sent as
        the transaction value; debt is the MUSD minted.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="BTC collateral" hint={`Available: ${trim(btcAvailable)}`} value={collateral} onChange={setCollateral} placeholder="0.05" />
        <Field label="MUSD to mint" hint="Stay above the min collateral ratio" value={debt} onChange={setDebt} placeholder="1000" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={submit} size="lg" disabled={!canSubmit}>
          {isPending ? "Confirm in wallet…" : confirming ? "Borrowing…" : "Borrow MUSD"}
        </Button>
        {!enabled && (
          <span className="text-xs text-foreground/55">
            Set <code className="font-mono">NEXT_PUBLIC_BORROWER_OPERATIONS</code> to enable borrowing.
          </span>
        )}
      </div>

      {isSuccess && <p className="mt-4 font-mono text-xs text-accent">Trove opened. MUSD minted.</p>}
      {error && (
        <p className="mt-4 max-w-lg font-mono text-xs text-[#b3492f]">
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}
    </Panel>
  );
}

export function DelegatePanel() {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [perAction, setPerAction] = useState("");

  return (
    <Panel title="Delegate to a Steward" hint="fundAgent">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Fund a scoped agent with MUSD. It acts on your behalf inside a budget and
        a per-action ceiling you set.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Agent name" hint="label only" value={name} onChange={(v) => setName(v.slice(0, 24))} placeholder="treasury-bot" raw />
        <Field label="MUSD budget" hint="total cap" value={budget} onChange={setBudget} placeholder="500" />
        <Field label="Max per action" hint="MEZO ceiling" value={perAction} onChange={setPerAction} placeholder="2" />
      </div>
      <div className="mt-6">
        <Button size="lg" disabled>
          Deploy Steward
        </Button>
      </div>
      <NotWired what="The agent registry / escrow contract is not deployed yet. This form captures the policy (budget, per-action ceiling) that will be committed on chain once the Steward contract ships on Mezo testnet." />
    </Panel>
  );
}

export function SettlePanel() {
  return (
    <Panel title="Settlement activity" hint="MEZO receipts">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Every action a Steward takes settles in MEZO as an on-chain payment. They
        appear here with amount, action and transaction hash.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-surface-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-foreground/45">
          <span>Action</span>
          <span>MEZO</span>
          <span>Tx</span>
        </div>
        <div className="px-4 py-10 text-center text-sm text-foreground/50">
          No settlements yet. Deploy a Steward to start the meter.
        </div>
      </div>
      <NotWired what="Settlement reads will subscribe to the agent contract's payment events on Mezo and list each MEZO transfer with its explorer link. Needs the Steward contract address first." />
    </Panel>
  );
}

export function EarnPanel() {
  const [amount, setAmount] = useState("");
  return (
    <Panel title="Stake MEZO" hint="stake">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Stake MEZO to earn yield from the fees agents pay, and unlock loyalty fee
        discounts. Rewards come from real usage, not emissions.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="MEZO to stake" hint="from your balance" value={amount} onChange={setAmount} placeholder="100" />
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/45">Est. APR</div>
          <div className="mt-1 font-serif text-2xl text-foreground/50">—</div>
        </div>
      </div>
      <div className="mt-6">
        <Button size="lg" disabled>
          Stake MEZO
        </Button>
      </div>
      <NotWired what="The staking pool that recycles agent fees into staker yield is not deployed yet. APR will be derived from realized fee flow once the pool ships." />
    </Panel>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  raw = false,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  raw?: boolean;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-foreground/60">{label}</span>
        <span className="text-[11px] text-foreground/45">{hint}</span>
      </div>
      <input
        inputMode={raw ? "text" : "decimal"}
        value={value}
        onChange={(e) => onChange(raw ? e.target.value : e.target.value.replace(/[^0-9.]/g, ""))}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-lg text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}
