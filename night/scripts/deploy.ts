import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import fs from "node:fs";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import {
  createWallet,
  createProviders,
  loadCompiledContract,
  newSeedHex,
  deriveKeys,
  createKeystore,
  PublicKey,
  Roles,
  NETWORKS,
  type NetworkName,
} from "./utils.js";

const PRIVATE_STATE_ID = "agentRegistryPrivateState";
const DEPLOYMENT_FILE  = "deployment.json";

function parseNetwork(): NetworkName {
  const idx = process.argv.indexOf("--network");
  const name = idx !== -1 ? process.argv[idx + 1] : "preprod";
  if (name !== "preprod" && name !== "preview") {
    console.error(`  Unknown network '${name}'. Use --network preprod or --network preview.`);
    process.exit(1);
  }
  return name as NetworkName;
}

async function main() {
  const network = parseNetwork();
  const cfg = NETWORKS[network];

  console.log(`\n=== Omnis: AgentRegistry deployment to Midnight ${network} ===\n`);

  const rl = createInterface({ input: stdin, output: stdout });

  const input = (await rl.question(
    "  Enter 64-char hex seed (blank = generate new): ",
  )).trim();

  let seedHex: string;
  if (input.length === 0) {
    seedHex = newSeedHex();
    const keys = deriveKeys(seedHex);
    const keystore = createKeystore(keys[Roles.NightExternal], cfg.networkId);
    const walletAddress = PublicKey.fromKeyStore(keystore).address;
    console.log(`\n  Generated seed   : ${seedHex}`);
    console.log(`  Wallet address   : ${walletAddress}`);
    console.log("\n  SAVE THE SEED.");
    console.log("  Go to the faucet in your browser, paste the wallet address, request tNight:");
    console.log(`  ${cfg.faucet}`);
    console.log("  (The faucet requires a browser captcha — it cannot be automated.)\n");
    await rl.question("  Press Enter once the faucet tx is confirmed (Ctrl+C to abort): ");
  } else if (input.length !== 64 || !/^[0-9a-fA-F]+$/.test(input)) {
    console.error("  Invalid seed: must be 64 hex characters.");
    rl.close();
    process.exit(1);
  } else {
    seedHex = input;
    const keys = deriveKeys(seedHex);
    const keystore = createKeystore(keys[Roles.NightExternal], cfg.networkId);
    const walletAddress = PublicKey.fromKeyStore(keystore).address;
    console.log(`\n  Wallet address   : ${walletAddress}`);
  }

  rl.close();

  console.log("\n  Loading compiled contract...");
  const { compiledContract } = await loadCompiledContract();

  console.log("  Creating wallet...");
  const walletCtx = await createWallet(seedHex, cfg);

  console.log("  Setting up providers...");
  const providers = await createProviders(walletCtx, cfg);

  const coinPk = providers.walletProvider.getCoinPublicKey();
  console.log(`  Coin public key: ${coinPk.slice(0, 20)}...`);
  console.log("\n  Deploying AgentRegistry...");
  console.log("  Proof server must be running at http://127.0.0.1:6300");
  console.log("  (start it with: npm run proof-server)\n");

  const deployed = await deployContract(providers as any, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: undefined,
  } as any);

  const address = deployed.deployTxData.public.contractAddress;
  const txId    = deployed.deployTxData.public.txId;

  const record = {
    contractAddress: address,
    txId,
    privateStateId: PRIVATE_STATE_ID,
    network,
    deployedAt: new Date().toISOString(),
    seed: seedHex,
  };

  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(record, null, 2));

  console.log("  Deployed.");
  console.log(`  Address : ${address}`);
  console.log(`  Tx ID   : ${txId}`);
  console.log(`  Saved   : ${DEPLOYMENT_FILE}`);
  console.log("\n  Set NEXT_PUBLIC_REGISTRY_ADDRESS in .env.local to use the browser app.");
  console.log(`  NEXT_PUBLIC_REGISTRY_ADDRESS=${address}\n`);

  await walletCtx.wallet.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error("\n  Deployment failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
