import type { Address } from "viem";
import { mezoMainnet, mezoTestnet } from "./config";

// Minimal ERC20 surface for balance reads.
export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type TokenSet = {
  musd?: Address;
  mezo?: Address;
};

// Verified from Mezo docs (contracts-reference). MEZO testnet address not published yet.
export const TOKENS: Record<number, TokenSet> = {
  [mezoMainnet.id]: {
    musd: "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186",
    mezo: "0x7B7c000000000000000000000000000000000001",
  },
  [mezoTestnet.id]: {
    musd: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  },
};

export function tokensFor(chainId: number): TokenSet {
  return TOKENS[chainId] ?? {};
}

// MUSD protocol contracts, verified from mezo-org/musd deployment artifacts. See MEZO_CONTRACTS.md.
type MezoContracts = {
  borrowerOperations: Address;
  hintHelpers: Address;
  sortedTroves: Address;
  troveManager: Address;
  priceFeed: Address;
};

const CONTRACTS: Record<number, MezoContracts> = {
  [mezoMainnet.id]: {
    borrowerOperations: "0x44b1bac67dDA612a41a58AAf779143B181dEe031",
    hintHelpers: "0xD267b3bE2514375A075fd03C3D9CBa6b95317DC3",
    sortedTroves: "0x8C5DB4C62BF29c1C4564390d10c20a47E0b2749f",
    troveManager: "0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193",
    priceFeed: "0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88",
  },
  [mezoTestnet.id]: {
    borrowerOperations: "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5",
    hintHelpers: "0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6",
    sortedTroves: "0x722E4D24FD6Ff8b0AC679450F3D91294607268fA",
    troveManager: "0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0",
    priceFeed: "0x86bCF0841622a5dAC14A313a15f96A95421b9366",
  },
};

// Optional env override for BorrowerOperations (e.g. a fresh redeploy); otherwise use the verified address.
const rawBorrower = process.env.NEXT_PUBLIC_BORROWER_OPERATIONS ?? "";
const borrowerOverride = (
  /^0x[a-fA-F0-9]{40}$/.test(rawBorrower) ? rawBorrower : undefined
) as Address | undefined;

export function mezoContractsFor(chainId: number): MezoContracts | undefined {
  const base = CONTRACTS[chainId];
  if (!base) return undefined;
  return borrowerOverride ? { ...base, borrowerOperations: borrowerOverride } : base;
}

// MUSD BorrowerOperations (signatures verified from mezo-org/musd IBorrowerOperations).
// Collateral (BTC) is msg.value on openTrove/addColl. Hints can be zeroAddress (gas-heavy but valid).
export const borrowerOperationsAbi = [
  {
    type: "function",
    name: "openTrove",
    stateMutability: "payable",
    inputs: [
      { name: "_debtAmount", type: "uint256" },
      { name: "_upperHint", type: "address" },
      { name: "_lowerHint", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "addColl",
    stateMutability: "payable",
    inputs: [
      { name: "_upperHint", type: "address" },
      { name: "_lowerHint", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawColl",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "_upperHint", type: "address" },
      { name: "_lowerHint", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawMUSD",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "_upperHint", type: "address" },
      { name: "_lowerHint", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "repayMUSD",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "_upperHint", type: "address" },
      { name: "_lowerHint", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "closeTrove",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// TroveManager: read a borrower's position. MUSD gas compensation is 200 MUSD (held in the gas pool).
export const troveManagerAbi = [
  {
    type: "function",
    name: "getTroveDebt",
    stateMutability: "view",
    inputs: [{ name: "_borrower", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTroveColl",
    stateMutability: "view",
    inputs: [{ name: "_borrower", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MCR",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// PriceFeed.fetchPrice returns BTC/USD (1e18). On-chain it is nonpayable but eth_call returns the value.
export const priceFeedAbi = [
  {
    type: "function",
    name: "fetchPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// MUSD gas compensation (held in gas pool, refunded on close); repayment on close = debt - this.
export const MUSD_GAS_COMPENSATION = BigInt("200000000000000000000");

// HintHelpers + SortedTroves: compute an efficient insert position so openTrove does not walk the whole list.
export const hintHelpersAbi = [
  {
    type: "function",
    name: "getApproxHint",
    stateMutability: "view",
    inputs: [
      { name: "_CR", type: "uint256" },
      { name: "_numTrials", type: "uint256" },
      { name: "_inputRandomSeed", type: "uint256" },
    ],
    outputs: [
      { name: "hintAddress", type: "address" },
      { name: "diff", type: "uint256" },
      { name: "latestRandomSeed", type: "uint256" },
    ],
  },
] as const;

export const sortedTrovesAbi = [
  {
    type: "function",
    name: "findInsertPosition",
    stateMutability: "view",
    inputs: [
      { name: "_NICR", type: "uint256" },
      { name: "_prevId", type: "address" },
      { name: "_nextId", type: "address" },
    ],
    outputs: [
      { name: "upperHint", type: "address" },
      { name: "lowerHint", type: "address" },
    ],
  },
  {
    type: "function",
    name: "getSize",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// StewardEscrow (our contract, ../contracts). Set after deploying to Mezo testnet.
const rawEscrow = process.env.NEXT_PUBLIC_STEWARD_ESCROW ?? "";
export const STEWARD_ESCROW = (
  /^0x[a-fA-F0-9]{40}$/.test(rawEscrow) ? rawEscrow : undefined
) as Address | undefined;

// StewardBridge Outbox (our trusted demo bridge, source side on Mezo). Deployed 2026-05-24.
const rawOutbox = process.env.NEXT_PUBLIC_BRIDGE_OUTBOX ?? "0xa2b457DAb5b0710A5B8063f813e5fbE3A19deb33";
export const BRIDGE_OUTBOX = (
  /^0x[a-fA-F0-9]{40}$/.test(rawOutbox) ? rawOutbox : undefined
) as Address | undefined;

export const bridgeOutboxAbi = [
  {
    type: "function",
    name: "lock",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destChainId", type: "uint64" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "nextNonce",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const stewardEscrowAbi = [
  {
    type: "function",
    name: "openAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "name", type: "bytes32" },
      { name: "budget", type: "uint256" },
      { name: "perActionCap", type: "uint256" },
      { name: "expiry", type: "uint64" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "payee", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "actionRef", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "topUp",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revoke",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "agentCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAgent",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "operator", type: "address" },
          { name: "name", type: "bytes32" },
          { name: "budget", type: "uint256" },
          { name: "spent", type: "uint256" },
          { name: "perActionCap", type: "uint256" },
          { name: "expiry", type: "uint64" },
          { name: "actions", type: "uint32" },
          { name: "revoked", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "totalFees",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "feeSink",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
] as const;
