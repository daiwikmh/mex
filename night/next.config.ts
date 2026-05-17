import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@midnight-ntwrk/compact-runtime",
    "@midnight-ntwrk/ledger-v8",
    "@midnight-ntwrk/onchain-runtime-v3",
    "@midnight-ntwrk/platform-js",
    "@midnight-ntwrk/midnight-js-contracts",
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
    "@midnight-ntwrk/midnight-js-http-client-proof-provider",
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
    "@midnight-ntwrk/midnight-js-level-private-state-provider",
  ],
  turbopack: {
    resolveAlias: {
      fs:              { browser: "./empty.ts" },
      path:            { browser: "./empty.ts" },
      "isomorphic-ws": { browser: "./shims/isomorphic-ws.ts" },
    },
  },
};

export default nextConfig;
