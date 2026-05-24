import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import { base, mainnet } from "viem/chains";

// Mezo chain definitions (BTC is the native gas token, 18 decimals).
export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.mezo.org"],
      webSocket: ["wss://rpc-ws.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: { name: "Mezo Testnet Explorer", url: "https://explorer.test.mezo.org" },
  },
  testnet: true,
});

export const mezoMainnet = defineChain({
  id: 31612,
  name: "Mezo Mainnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://mezo.drpc.org"],
      webSocket: ["wss://mezo.drpc.org"],
    },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.mezo.org" },
  },
});

export const MEZO_NETWORK: "mainnet" | "testnet" =
  process.env.NEXT_PUBLIC_MEZO_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const activeChain = MEZO_NETWORK === "mainnet" ? mezoMainnet : mezoTestnet;

// Ethereum + Base are read-only sources for cross-chain balance reads (no wallet switch needed).
export const wagmiConfig = createConfig({
  chains: [mezoTestnet, mezoMainnet, mainnet, base],
  connectors: [injected()],
  transports: {
    [mezoTestnet.id]: http(mezoTestnet.rpcUrls.default.http[0]),
    [mezoMainnet.id]: http(mezoMainnet.rpcUrls.default.http[0]),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETH_RPC || undefined),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || undefined),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
