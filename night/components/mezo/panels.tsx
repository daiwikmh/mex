"use client";

import { useEffect, useState } from "react";
import {
  formatUnits,
  hexToString,
  isAddress,
  maxUint256,
  parseEther,
  parseUnits,
  stringToHex,
  zeroAddress,
  type Address,
} from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/mezo/WalletButton";
import { activeChain, wagmiConfig } from "@/lib/mezo/config";
import {
  borrowerOperationsAbi,
  erc20Abi,
  hintHelpersAbi,
  mezoContractsFor,
  sortedTrovesAbi,
  STEWARD_ESCROW,
  stewardEscrowAbi,
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

// Best-effort efficient insert hints for openTrove; falls back to zeroAddress (works, just gas-heavy).
async function resolveTroveHints(
  chainId: number,
  collateralWei: bigint,
  debtWei: bigint,
): Promise<[Address, Address]> {
  const c = mezoContractsFor(chainId);
  if (!c || debtWei === BigInt(0)) return [zeroAddress, zeroAddress];
  try {
    const nicr = (collateralWei * BigInt(10) ** BigInt(20)) / debtWei;
    const size = (await readContract(wagmiConfig, {
      address: c.sortedTroves,
      abi: sortedTrovesAbi,
      functionName: "getSize",
    })) as bigint;
    const numTrials = BigInt(Math.max(1, Math.ceil(15 * Math.sqrt(Number(size)))));
    const seed = BigInt(Math.floor(Math.random() * 1e12));
    const [approxHint] = (await readContract(wagmiConfig, {
      address: c.hintHelpers,
      abi: hintHelpersAbi,
      functionName: "getApproxHint",
      args: [nicr, numTrials, seed],
    })) as [Address, bigint, bigint];
    const [upper, lower] = (await readContract(wagmiConfig, {
      address: c.sortedTroves,
      abi: sortedTrovesAbi,
      functionName: "findInsertPosition",
      args: [nicr, approxHint, approxHint],
    })) as [Address, Address];
    return [upper, lower];
  } catch {
    return [zeroAddress, zeroAddress];
  }
}

export function BorrowPanel() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: btc } = useBalance({ address });
  const btcAvailable = btc ? btc.formatted : "0";

  const [collateral, setCollateral] = useState("");
  const [debt, setDebt] = useState("");
  const [resolving, setResolving] = useState(false);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contracts = mezoContractsFor(chainId);
  const enabled = Boolean(contracts);
  const busy = resolving || isPending || confirming;
  const canSubmit = enabled && Number(collateral) > 0 && Number(debt) > 0 && !busy;

  async function submit() {
    if (!contracts) return;
    const collateralWei = parseEther(collateral);
    const debtWei = parseUnits(debt, 18);
    setResolving(true);
    const [upper, lower] = await resolveTroveHints(chainId, collateralWei, debtWei);
    setResolving(false);
    writeContract({
      address: contracts.borrowerOperations,
      abi: borrowerOperationsAbi,
      functionName: "openTrove",
      args: [debtWei, upper, lower],
      value: collateralWei,
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
          {resolving
            ? "Finding position…"
            : isPending
              ? "Confirm in wallet…"
              : confirming
                ? "Borrowing…"
                : "Borrow MUSD"}
        </Button>
        {!enabled && (
          <span className="text-xs text-foreground/55">
            Borrowing is unavailable on this network.
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

type AgentTuple = {
  owner: Address;
  operator: Address;
  name: `0x${string}`;
  budget: bigint;
  spent: bigint;
  perActionCap: bigint;
  expiry: bigint;
  actions: number;
  revoked: boolean;
};

function agentName(name: `0x${string}`) {
  try {
    return hexToString(name, { size: 32 }).replace(/ +$/, "") || "steward";
  } catch {
    return "steward";
  }
}

function StewardNotDeployed({ title, hint, intro }: { title: string; hint: string; intro: string }) {
  return (
    <Panel title={title} hint={hint}>
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">{intro}</p>
      <NotWired what="StewardEscrow is not deployed yet. Deploy the contracts/ project to Mezo testnet (forge script script/Deploy.s.sol --rpc-url mezo_testnet --private-key $PK --broadcast) and set NEXT_PUBLIC_STEWARD_ESCROW to the deployed address to go live." />
    </Panel>
  );
}

export function DelegatePanel() {
  const { address } = useAccount();
  const chainId = useChainId();
  const musd = tokensFor(chainId).musd;

  const [operator, setOperator] = useState("");
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [perAction, setPerAction] = useState("");
  const [days, setDays] = useState("30");

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: musd,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && STEWARD_ESCROW ? [address, STEWARD_ESCROW] : undefined,
    query: { enabled: Boolean(address && musd && STEWARD_ESCROW) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) refetchAllowance();
  }, [isSuccess, refetchAllowance]);

  if (!STEWARD_ESCROW) {
    return (
      <StewardNotDeployed
        title="Delegate to a Steward"
        hint="openAgent"
        intro="Fund a scoped agent with MUSD. It acts on your behalf inside a budget and a per-action ceiling you set."
      />
    );
  }

  const budgetWei = budget && Number(budget) > 0 ? parseUnits(budget, 18) : BigInt(0);
  const needsApproval =
    allowance != null && budgetWei > BigInt(0) && (allowance as bigint) < budgetWei;
  const formValid =
    isAddress(operator) &&
    Number(budget) > 0 &&
    Number(perAction) > 0 &&
    Number(perAction) <= Number(budget) &&
    Number(days) > 0 &&
    Boolean(musd);
  const busy = isPending || confirming;

  function approve() {
    if (!musd) return;
    writeContract({
      address: musd,
      abi: erc20Abi,
      functionName: "approve",
      args: [STEWARD_ESCROW as Address, maxUint256],
    });
  }

  function delegate() {
    const expiry = BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400);
    writeContract({
      address: STEWARD_ESCROW as Address,
      abi: stewardEscrowAbi,
      functionName: "openAgent",
      args: [
        operator as Address,
        stringToHex((name || "steward").slice(0, 31), { size: 32 }),
        budgetWei,
        parseUnits(perAction, 18),
        expiry,
      ],
    });
  }

  return (
    <Panel title="Delegate to a Steward" hint="openAgent">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Fund a scoped agent with MUSD. It acts on your behalf inside a budget,
        per-action ceiling and expiry committed on chain. Revoke any time.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Operator address" hint="the agent's settling key" value={operator} onChange={setOperator} placeholder="0x…" raw />
        <Field label="Agent name" hint="label only" value={name} onChange={(v) => setName(v.slice(0, 31))} placeholder="treasury-bot" raw />
        <Field label="MUSD budget" hint="total escrowed" value={budget} onChange={setBudget} placeholder="500" />
        <Field label="Max per action" hint="MUSD ceiling" value={perAction} onChange={setPerAction} placeholder="2" />
        <Field label="Expiry (days)" hint="auto-stops after" value={days} onChange={setDays} placeholder="30" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {needsApproval ? (
          <Button onClick={approve} size="lg" disabled={!formValid || busy}>
            {busy ? "Approving…" : "Approve MUSD"}
          </Button>
        ) : (
          <Button onClick={delegate} size="lg" disabled={!formValid || busy}>
            {isPending ? "Confirm in wallet…" : confirming ? "Delegating…" : "Delegate MUSD"}
          </Button>
        )}
        <span className="text-xs text-foreground/55">
          {needsApproval ? "One-time approval, then delegate." : "Escrows your MUSD under the policy."}
        </span>
      </div>

      {isSuccess && !needsApproval && (
        <p className="mt-4 font-mono text-xs text-accent">Steward funded. Policy committed on chain.</p>
      )}
      {error && (
        <p className="mt-4 max-w-lg font-mono text-xs text-[#b3492f]">
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}

      <AgentsList me={address} mineOnly controls />
    </Panel>
  );
}

function AgentsList({
  me,
  mineOnly = false,
  controls = false,
}: {
  me?: Address;
  mineOnly?: boolean;
  controls?: boolean;
}) {
  const { data: count } = useReadContract({
    address: STEWARD_ESCROW,
    abi: stewardEscrowAbi,
    functionName: "agentCount",
    query: { enabled: Boolean(STEWARD_ESCROW) },
  });
  const n = count ? Number(count as bigint) : 0;

  const { data } = useReadContracts({
    allowFailure: true,
    contracts: Array.from({ length: n }, (_, i) => ({
      address: STEWARD_ESCROW as Address,
      abi: stewardEscrowAbi,
      functionName: "getAgent",
      args: [BigInt(i)],
    })),
    query: { enabled: n > 0 && Boolean(STEWARD_ESCROW) },
  });

  const agents = (data ?? [])
    .map((r, i) => (r.status === "success" ? { id: i, ...(r.result as unknown as AgentTuple) } : null))
    .filter((a): a is { id: number } & AgentTuple => a != null)
    .filter((a) =>
      !mineOnly
        ? true
        : me != null &&
          (a.owner.toLowerCase() === me.toLowerCase() || a.operator.toLowerCase() === me.toLowerCase()),
    );

  if (agents.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-background/60 p-5 text-sm text-foreground/55">
        {mineOnly ? "No agents yet. Delegate MUSD above to open one." : "No agents have been opened yet."}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/45">
        {mineOnly ? "Your agents" : "All agents"}
      </div>
      <div className="mt-3 space-y-3">
        {agents.map((a) => (
          <AgentRow key={a.id} agent={a} me={me} controls={controls} />
        ))}
      </div>
    </div>
  );
}

function AgentRow({
  agent,
  me,
  controls,
}: {
  agent: { id: number } & AgentTuple;
  me?: Address;
  controls: boolean;
}) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || confirming;

  const isOwner = me != null && agent.owner.toLowerCase() === me.toLowerCase();
  const isOperator = me != null && agent.operator.toLowerCase() === me.toLowerCase();
  const expired = Number(agent.expiry) * 1000 < Date.now();
  const status = agent.revoked ? "revoked" : expired ? "expired" : "active";

  function revoke() {
    writeContract({
      address: STEWARD_ESCROW as Address,
      abi: stewardEscrowAbi,
      functionName: "revoke",
      args: [BigInt(agent.id)],
    });
  }

  function settleDemo() {
    const amount = agent.perActionCap < agent.budget ? agent.perActionCap : agent.budget;
    if (amount <= BigInt(0)) return;
    writeContract({
      address: STEWARD_ESCROW as Address,
      abi: stewardEscrowAbi,
      functionName: "settle",
      args: [BigInt(agent.id), agent.owner, amount, stringToHex(`act-${Date.now()}`.slice(0, 31), { size: 32 })],
    });
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-foreground">{agentName(agent.name)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              status === "active" ? "bg-accent/15 text-accent" : "bg-foreground/8 text-foreground/45"
            }`}
          >
            {status}
          </span>
          <span className="font-mono text-[11px] text-foreground/40">#{agent.id}</span>
        </div>
        {controls && status === "active" && (
          <div className="flex gap-2">
            {isOperator && (
              <Button onClick={settleDemo} variant="secondary" size="sm" disabled={busy}>
                {busy ? "…" : "Settle action"}
              </Button>
            )}
            {isOwner && (
              <Button onClick={revoke} variant="ghost" size="sm" disabled={busy}>
                {busy ? "…" : "Revoke"}
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Budget" value={`${trim(formatUnits(agent.budget, 18))} MUSD`} />
        <Stat label="Spent" value={`${trim(formatUnits(agent.spent, 18))} MUSD`} />
        <Stat label="Per action" value={`${trim(formatUnits(agent.perActionCap, 18))} MUSD`} />
        <Stat label="Actions" value={String(agent.actions)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">{label}</div>
      <div className="mt-1 font-mono text-sm text-foreground">{value}</div>
    </div>
  );
}

export function SettlePanel() {
  const { address } = useAccount();

  if (!STEWARD_ESCROW) {
    return (
      <StewardNotDeployed
        title="Settlement activity"
        hint="settle"
        intro="Every action a Steward takes settles on chain as a metered MUSD payment, with a fee routed to the staking pool."
      />
    );
  }

  return (
    <Panel title="Settlement activity" hint="settle">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        Every metered action draws down an agent&apos;s budget and routes a fee to
        the pool. Live agent meters below; settle from the Delegate tab as an
        operator.
      </p>
      <AgentsList me={address} />
    </Panel>
  );
}

export function EarnPanel() {
  const chainId = useChainId();
  const musd = tokensFor(chainId).musd;

  const { data: totalFees } = useReadContract({
    address: STEWARD_ESCROW,
    abi: stewardEscrowAbi,
    functionName: "totalFees",
    query: { enabled: Boolean(STEWARD_ESCROW) },
  });
  const { data: feeSink } = useReadContract({
    address: STEWARD_ESCROW,
    abi: stewardEscrowAbi,
    functionName: "feeSink",
    query: { enabled: Boolean(STEWARD_ESCROW) },
  });
  const { data: feeBps } = useReadContract({
    address: STEWARD_ESCROW,
    abi: stewardEscrowAbi,
    functionName: "feeBps",
    query: { enabled: Boolean(STEWARD_ESCROW) },
  });
  const { data: poolBal } = useReadContract({
    address: musd,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: feeSink ? [feeSink as Address] : undefined,
    query: { enabled: Boolean(musd && feeSink) },
  });

  if (!STEWARD_ESCROW) {
    return (
      <StewardNotDeployed
        title="Earn from agent fees"
        hint="feeSink"
        intro="A share of every agent settlement accrues to the staking pool. Stakers earn from real usage, not emissions."
      />
    );
  }

  return (
    <Panel title="Earn from agent fees" hint="feeSink">
      <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
        A share of every agent settlement accrues to the staking pool. This is
        yield from real agent usage, not emissions.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BalanceCard label="Pool balance" sub="MUSD held by feeSink" value={poolBal != null ? trim(formatUnits(poolBal as bigint, 18)) : "—"} />
        <BalanceCard label="Lifetime fees" sub="routed to stakers" value={totalFees != null ? trim(formatUnits(totalFees as bigint, 18)) : "—"} />
        <BalanceCard label="Fee rate" sub="per settlement" value={feeBps != null ? `${Number(feeBps) / 100}%` : "—"} />
      </div>
      <NotWired what="Staking deposits (locking MEZO to claim a share of these fees) ship next. Today this shows the live fee pool fed by real settlements." />
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
