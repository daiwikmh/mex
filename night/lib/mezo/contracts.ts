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

// BorrowerOperations is not on the public reference page; supply it via env to enable borrowing.
const rawBorrower = process.env.NEXT_PUBLIC_BORROWER_OPERATIONS ?? "";
export const BORROWER_OPERATIONS = (
  /^0x[a-fA-F0-9]{40}$/.test(rawBorrower) ? rawBorrower : undefined
) as Address | undefined;

// MUSD BorrowerOperations.openTrove(debtAmount, upperHint, lowerHint) payable; collateral is msg.value (BTC).
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
] as const;
