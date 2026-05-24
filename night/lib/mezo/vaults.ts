import { base, mainnet } from "viem/chains";

// Curated yield vaults on other chains a Steward could deploy into. Aave v3 markets:
// the position lives in the aToken (balanceOf == underlying incl. accrued interest).
// aToken addresses derived on-chain via Pool.getReserveData and verified (decimals + symbol), 2026-05-24.
// llamaPool = DeFiLlama yields pool uuid (live APY via /chart/{uuid}).
export const VAULTS = [
  {
    id: "eth-aave-usdc",
    llamaPool: "aa70268e-4b52-42bf-a116-608b370f9501",
    chainId: mainnet.id,
    chainName: "Ethereum",
    project: "Aave v3",
    asset: "USDC",
    kind: "stable",
    aToken: "0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c",
    decimals: 6,
  },
  {
    id: "eth-aave-wbtc",
    llamaPool: "7e382157-b1bc-406d-b17b-facba43b716e",
    chainId: mainnet.id,
    chainName: "Ethereum",
    project: "Aave v3",
    asset: "WBTC",
    kind: "btc",
    aToken: "0x5ee5bf7ae06d1be5997a1a72006fe6c607ec6de8",
    decimals: 8,
  },
  {
    id: "base-aave-usdc",
    llamaPool: "7e0661bf-8cf3-45e6-9424-31916d4c7b84",
    chainId: base.id,
    chainName: "Base",
    project: "Aave v3",
    asset: "USDC",
    kind: "stable",
    aToken: "0x4e65fe4dba92790696d040ac24aa414708f5c0ab",
    decimals: 6,
  },
  {
    id: "base-aave-cbbtc",
    llamaPool: "89bc7c4c-d71c-435c-ab28-56c803d51320",
    chainId: base.id,
    chainName: "Base",
    project: "Aave v3",
    asset: "cbBTC",
    kind: "btc",
    aToken: "0xbdb9300b7cde636d9cd4aff00f6f009ffbbc8ee6",
    decimals: 8,
  },
] as const;

export type VaultApy = { id: string; apy: number | null; tvlUsd: number | null };
