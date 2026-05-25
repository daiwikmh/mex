import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import { baseSepolia } from "viem/chains";

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

// Testnet-only for now. Mezo testnet is the home chain; Base Sepolia is the vault target.
export const activeChain = mezoTestnet;

export const wagmiConfig = createConfig({
  chains: [mezoTestnet, baseSepolia],
  connectors: [injected()],
  transports: {
    [mezoTestnet.id]: http(mezoTestnet.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || undefined),
  },
  ssr: true,
});

export const TESTNET_VAULT_CHAIN = baseSepolia;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
