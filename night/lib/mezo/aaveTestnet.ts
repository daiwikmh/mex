import { baseSepolia } from "viem/chains";
import type { Address } from "viem";

// Aave v3 on Base Sepolia (testnet). Addresses from bgd-labs/aave-address-book, verified on-chain
// 2026-05-24 (Pool.getReserveData aToken match + decimals). Real supply/withdraw works here.
export const AAVE_BASE_SEPOLIA = {
  chainId: baseSepolia.id,
  pool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27" as Address,
  dataProvider: "0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b" as Address,
  // Aave's testnet faucet UI (mint test tokens to your wallet).
  faucetUrl: "https://bridge-testnet.aave.com/faucet/?marketName=proto_base_sepolia_v3",
};

export const TESTNET_VAULTS = [
  {
    id: "basesep-aave-wbtc",
    asset: "WBTC",
    kind: "btc",
    underlying: "0x54114591963CF60EF3aA63bEfD6eC263D98145a4" as Address,
    aToken: "0x47Db195BAf46898302C06c31bCF46c01C64ACcF9" as Address,
    decimals: 8,
  },
  {
    id: "basesep-aave-usdc",
    asset: "USDC",
    kind: "stable",
    underlying: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f" as Address,
    aToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC" as Address,
    decimals: 6,
  },
] as const;

export type TestnetVault = (typeof TESTNET_VAULTS)[number];

// Aave Pool: deposit and withdraw.
export const aavePoolAbi = [
  {
    type: "function",
    name: "supply",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// PoolDataProvider.getReserveData returns flat values; liquidityRate (ray) is index 5.
export const aaveDataProviderAbi = [
  {
    type: "function",
    name: "getReserveData",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      { name: "unbacked", type: "uint256" },
      { name: "accruedToTreasuryScaled", type: "uint256" },
      { name: "totalAToken", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" },
    ],
  },
] as const;

// Liquidity rate is in ray (1e27) as APR. Convert to a percent number.
export function rayToApr(rate: bigint): number {
  return Number(rate) / 1e27 * 100;
}
