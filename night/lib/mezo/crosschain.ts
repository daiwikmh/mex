import { base, mainnet } from "viem/chains";

// BTC-like assets + stables a holder might bring into Mezo. Canonical mainnet/Base addresses.
export const CROSS_CHAIN_SOURCES = [
  {
    chainId: mainnet.id,
    name: "Ethereum",
    tokens: [
      { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, kind: "btc" },
      { symbol: "tBTC", address: "0x18084fbA666a33d37592fA2633fD49a74DD93a88", decimals: 18, kind: "btc" },
      { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8, kind: "btc" },
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, kind: "stable" },
    ],
  },
  {
    chainId: base.id,
    name: "Base",
    tokens: [
      { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8, kind: "btc" },
      { symbol: "tBTC", address: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b", decimals: 18, kind: "btc" },
      { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, kind: "stable" },
    ],
  },
] as const;

// Mezo's real bridge entry point; Steward links out rather than moving funds itself.
export const MEZO_BRIDGE_URL = "https://mezo.org/overview";
