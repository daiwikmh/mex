import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocket } from "ws";
import * as Rx from "rxjs";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import { HDWallet, Roles, generateRandomSeed } from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  UnshieldedWallet,
  createKeystore,
  PublicKey,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";

export { Roles, createKeystore, PublicKey };

// @ts-expect-error wallet sync needs WebSocket in Node
globalThis.WebSocket = WebSocket;

export type NetworkName = "preprod" | "preview";

export const NETWORKS: Record<NetworkName, {
  networkId: string;
  indexer: string;
  indexerWS: string;
  relay: string;
  faucet: string;
  proofServer: string;
}> = {
  preprod: {
    networkId:   "preprod",
    indexer:     "https://indexer.preprod.midnight.network/api/v4/graphql",
    indexerWS:   "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
    relay:       "wss://rpc.preprod.midnight.network",
    faucet:      "https://faucet.preprod.midnight.network",
    proofServer: "http://127.0.0.1:6300",
  },
  preview: {
    networkId:   "preview",
    indexer:     "https://indexer.preview.midnight.network/api/v4/graphql",
    indexerWS:   "wss://indexer.preview.midnight.network/api/v4/graphql/ws",
    relay:       "wss://rpc.preview.midnight.network",
    faucet:      "https://faucet.preview.midnight.network",
    proofServer: "http://127.0.0.1:6300",
  },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const contractDistPath = path.resolve(
  __dirname, "..", "contracts", "agent-registry", "dist",
);

export async function loadCompiledContract() {
  const contractIndexUrl = pathToFileURL(
    path.join(contractDistPath, "contract", "index.js"),
  ).href;
  const AgentRegistry = await import(contractIndexUrl);
  const compiled = CompiledContract.make("AgentRegistry", AgentRegistry.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(contractDistPath),
  );
  return { AgentRegistry, compiledContract: compiled };
}

export function deriveKeys(seedHex: string) {
  const seed = Buffer.from(seedHex, "hex");
  const result = HDWallet.fromSeed(seed);
  if (result.type !== "seedOk") throw new Error("Invalid seed for HDWallet");
  const keys = result.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  result.hdWallet.clear();
  if (keys.type !== "keysDerived") throw new Error("Key derivation failed");
  return keys.keys;
}

export function newSeedHex(): string {
  return Buffer.from(generateRandomSeed()).toString("hex");
}

export async function createWallet(seedHex: string, cfg: typeof NETWORKS[NetworkName]) {
  const keys = deriveKeys(seedHex);
  const networkId = cfg.networkId as any;

  setNetworkId(networkId);

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey      = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  const walletCfg = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: cfg.indexer,
      indexerWsUrl:   cfg.indexerWS,
    },
    provingServerUrl: new URL(cfg.proofServer),
    relayURL:         new URL(cfg.relay),
  };

  const shieldedWallet   = ShieldedWallet(walletCfg).startWithSecretKeys(shieldedSecretKeys);
  const unshieldedWallet = UnshieldedWallet({
    networkId,
    indexerClientConnection: walletCfg.indexerClientConnection,
    txHistoryStorage: { get: async () => undefined, set: async () => {} } as any,
  }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
  const dustWallet = DustWallet({
    ...walletCfg,
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  }).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);

  const wallet = await WalletFacade.init({
    configuration: walletCfg as any,
    shielded: () => shieldedWallet,
    unshielded: () => unshieldedWallet,
    dust: () => dustWallet,
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

export async function createProviders(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  cfg: typeof NETWORKS[NetworkName],
) {
  console.log("  Syncing wallet (this can take several minutes on a fresh sync)...");
  const state = await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(
      Rx.throttleTime(5_000, undefined, { leading: true, trailing: true }),
      Rx.tap((s: any) => {
        const sp = s.shielded?.state?.progress;
        const dp = s.dust?.state?.progress;
        const up = s.unshielded?.progress;
        const shS = sp?.isStrictlyComplete?.() ? "synced" : `${sp?.appliedIndex ?? "?"}/${sp?.highestRelevantIndex ?? "?"}`;
        const duS = dp?.isStrictlyComplete?.() ? "synced" : `${dp?.appliedIndex ?? "?"}/${dp?.highestRelevantIndex ?? "?"}`;
        const unS = up?.isStrictlyComplete?.() ? "synced" : `${up?.appliedId ?? "?"}/${up?.highestTransactionId ?? "?"}`;
        process.stdout.write(`\r  shielded=${shS}  dust=${duS}  unshielded=${unS}        `);
      }),
      Rx.filter((s: any) =>
        s.shielded?.state?.progress?.isStrictlyComplete?.() === true &&
        s.dust?.state?.progress?.isStrictlyComplete?.() === true &&
        s.unshielded?.progress?.isStrictlyComplete?.() === true,
      ),
    ),
  );
  console.log("\n  Wallet synced.");

  const zkConfigProvider = new NodeZkConfigProvider<string>(contractDistPath);

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey:      walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx),
  };

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: async () => "Omnis-deploy",
      accountId: state.shielded.coinPublicKey.toHexString(),
    }),
    publicDataProvider: indexerPublicDataProvider(cfg.indexer, cfg.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(cfg.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: { submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) },
  };
}
