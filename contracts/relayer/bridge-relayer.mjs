// StewardBridge relayer (testnet demo). Watches Locked events on the Mezo Outbox and calls
// release() on the Base Sepolia Inbox. Trusted single relayer — testnet only.
//
// Run:  RELAYER_PK=0x... node bridge-relayer.mjs
// Env:  MEZO_RPC, BASE_SEPOLIA_RPC, OUTBOX, INBOX, RELAYER_PK, FROM_BLOCK (optional), POLL_MS (optional)
//
// Requires viem (installed in ../../night). Run with: node --experimental-vm-modules or just node 22.

import { createPublicClient, createWalletClient, http, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const MEZO_RPC = process.env.MEZO_RPC || "https://rpc.test.mezo.org";
const BASE_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const OUTBOX = process.env.OUTBOX || "0xa2b457DAb5b0710A5B8063f813e5fbE3A19deb33";
const INBOX = process.env.INBOX; // Base Sepolia BridgeInbox (deploy first)
const PK = process.env.RELAYER_PK;
const POLL_MS = Number(process.env.POLL_MS || 8000);

if (!PK) throw new Error("set RELAYER_PK");
if (!INBOX) throw new Error("set INBOX (deploy BridgeInbox on Base Sepolia first)");

const account = privateKeyToAccount(PK.startsWith("0x") ? PK : `0x${PK}`);

const lockedEvent = parseAbiItem(
  "event Locked(uint256 indexed nonce, address indexed sender, address indexed recipient, uint256 amount, uint64 destChainId)",
);
const inboxAbi = [
  { type: "function", name: "release", stateMutability: "nonpayable", inputs: [
    { name: "sourceNonce", type: "uint256" }, { name: "recipient", type: "address" }, { name: "amount", type: "uint256" },
  ], outputs: [] },
  { type: "function", name: "processed", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
];

const mezo = createPublicClient({ transport: http(MEZO_RPC) });
const base = createPublicClient({ transport: http(BASE_RPC) });
const wallet = createWalletClient({ account, transport: http(BASE_RPC) });

let fromBlock = process.env.FROM_BLOCK ? BigInt(process.env.FROM_BLOCK) : 0n;

console.log(`relayer ${account.address}  outbox ${OUTBOX} (mezo)  ->  inbox ${INBOX} (base sepolia)`);

async function tick() {
  const head = await mezo.getBlockNumber();
  if (fromBlock === 0n) fromBlock = head > 5000n ? head - 5000n : 0n;
  if (fromBlock > head) return;
  const logs = await mezo.getLogs({ address: OUTBOX, event: lockedEvent, fromBlock, toBlock: head });
  for (const log of logs) {
    const { nonce, recipient, amount, destChainId } = log.args;
    if (destChainId !== 84532n) continue; // only Base Sepolia
    const done = await base.readContract({ address: INBOX, abi: inboxAbi, functionName: "processed", args: [nonce] });
    if (done) continue;
    console.log(`releasing nonce ${nonce} -> ${recipient} amount ${amount}`);
    const hash = await wallet.writeContract({ address: INBOX, abi: inboxAbi, functionName: "release", args: [nonce, recipient, amount] });
    await base.waitForTransactionReceipt({ hash });
    console.log(`  released, tx ${hash}`);
  }
  fromBlock = head + 1n;
}

setInterval(() => tick().catch((e) => console.error("tick error:", e.shortMessage || e.message)), POLL_MS);
tick().catch((e) => console.error(e));
