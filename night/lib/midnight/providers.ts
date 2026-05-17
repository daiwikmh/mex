"use client";

import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { createProofProvider } from "@midnight-ntwrk/midnight-js-types";
import { toHex, fromHex } from "@midnight-ntwrk/midnight-js-utils";
import { Transaction, type FinalizedTransaction } from "@midnight-ntwrk/ledger-v8";
import { createMemoryPrivateStateProvider } from "./memory-private-state-provider";
import type {
  MidnightProvider,
  MidnightProviders,
  PrivateStateProvider,
  ProofProvider,
  PublicDataProvider,
  WalletProvider,
  ZKConfigProvider,
} from "@midnight-ntwrk/midnight-js-types";
import type { ConnectedWallet } from "./wallet";

export const DEFAULT_NETWORK_ID = "preview";

export type AgentRegistryCircuitKey =
  | "register_agent"
  | "set_policy"
  | "log_query"
  | "revoke_agent";

export const AGENT_REGISTRY_PRIVATE_STATE_ID = "agentRegistryPrivateState";

export interface AgentRegistryProviders extends MidnightProviders<AgentRegistryCircuitKey> {
  privateStateProvider: PrivateStateProvider;
  publicDataProvider: PublicDataProvider;
  proofProvider: ProofProvider;
  zkConfigProvider: ZKConfigProvider<AgentRegistryCircuitKey>;
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
}

const STORAGE_PREFIX = "Omnis:midnight";

let configuredNetworkId: string | null = null;

export function ensureNetwork(id: string): void {
  if (configuredNetworkId === id) return;
  setNetworkId(id);
  configuredNetworkId = id;
}

export async function buildProviders(
  wallet: ConnectedWallet,
): Promise<AgentRegistryProviders> {
  const { api, config, shieldedAddress } = wallet;
  ensureNetwork(config.networkId);

  const zkConfigProvider = new FetchZkConfigProvider<AgentRegistryCircuitKey>(
    window.location.origin,
    fetch.bind(window),
  );

  let proofProvider: ProofProvider;
  if (typeof api.getProvingProvider === "function") {
    const provingProvider = await api.getProvingProvider({
      getProverKey:   (id: string) => zkConfigProvider.getProverKey(id as AgentRegistryCircuitKey),
      getVerifierKey: (id: string) => zkConfigProvider.getVerifierKey(id as AgentRegistryCircuitKey),
      getZKIR:        (id: string) => zkConfigProvider.getZKIR(id as AgentRegistryCircuitKey),
    });
    proofProvider = createProofProvider(provingProvider);
  } else if (config.proverServerUri) {
    proofProvider = httpClientProofProvider(config.proverServerUri, zkConfigProvider);
  } else {
    throw new Error(
      "Wallet exposes neither getProvingProvider nor proverServerUri. Cannot generate proofs.",
    );
  }

  const publicDataProvider = indexerPublicDataProvider(
    config.indexerUri,
    config.indexerWsUri,
  );

  const privateStateProvider = createMemoryPrivateStateProvider({
    storageKeyPrefix: STORAGE_PREFIX,
    accountId: shieldedAddress,
  });

  const addresses = await api.getShieldedAddresses();

  const walletProvider: WalletProvider = {
    getCoinPublicKey() {
      return addresses.shieldedCoinPublicKey;
    },
    getEncryptionPublicKey() {
      return addresses.shieldedEncryptionPublicKey;
    },
    async balanceTx(tx) {
      const serializedTx = toHex(tx.serialize());
      const balanced = await api.balanceUnsealedTransaction(serializedTx);
      return Transaction.deserialize(
        "signature",
        "proof",
        "binding",
        fromHex(balanced.tx),
      ) as FinalizedTransaction;
    },
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx) {
      const serialized = toHex(tx.serialize());
      await api.submitTransaction(serialized);
      const ids = tx.identifiers();
      return ids[0];
    },
  };

  return {
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    privateStateProvider,
    walletProvider,
    midnightProvider,
  };
}

