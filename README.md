# Mex

Bank your Bitcoin on Mezo. Borrow MUSD against BTC, hand a scoped, revocable, metered
MUSD budget to a delegated operator, settle each action on chain, and route a fee to a
pool. Revoke any time and the chain refunds the remainder.

The flywheel: **payments fund the pool, the pool rewards stakers.**

```
Borrow MUSD against BTC ──▶ Delegate MUSD (budget + per-action cap + expiry)
        ▲                                   │
        │                                   ▼
   Earn (fee pool) ◀── fee per action ── Settle (metered, on chain)
```

Repo layout:

| Path | What |
|---|---|
| `night/` | Next.js 16 + React 19 app (console + landing) |
| `contracts/` | Foundry project — StewardEscrow + StewardBridge |

---

## What's live right now (demo)

All of this runs on **Mezo testnet (chain 31611)** and has been exercised on chain unless noted.

| Action | Where | Status |
|---|---|---|
| Borrow MUSD against BTC (`openTrove`) | `/app/borrow` | ✅ Live — minted 1,800 MUSD on chain |
| View + manage trove (collateral, debt, ICR, liquidation price; add/withdraw collateral, repay, borrow more, close) | `/app/borrow` | ✅ Live — reads verified against the open trove |
| Delegate MUSD to an operator (`openAgent`) | `/app/delegate` | ✅ Live on chain |
| Settle a metered action (`settle`, fee → pool) | `/app/delegate` · `/app/settle` | ✅ Live on chain |
| Revoke an agent + refund remainder (`revoke`) | `/app/delegate` | ✅ Live — chain blocks settles after revoke |
| Earn — read the live fee pool | `/app/earn` | ✅ Live reads (`totalFees`, `feeSink`, fee rate) |
| Bridge — lock MUSD on Mezo (`StewardBridge`) | `/app/bridge` (testnet) | ✅ Source side live — 10 MUSD locked on chain |
| Cross-chain balances (Ethereum + Base) | `/app/bridge` (mainnet) | ✅ Live reads (needs a wallet holding those assets) |
| Yield vaults — Aave APYs + your positions | `/app/vaults` (mainnet) | ✅ Live (DeFiLlama APYs + on-chain positions) |
| Testnet vault deposit/withdraw (Aave Base Sepolia) | `/app/vaults` (testnet) | ⏳ UI live, reads verified — needs Base Sepolia gas + faucet tokens to transact |
| Bridge completion (mint bMUSD on Base) | relayer + Inbox | ⏳ Built, not deployed — needs Base Sepolia gas |
| Staking deposits (lock MEZO for fee share) | `/app/earn` | ❌ Not built (Earn shows the pool only) |

**Recommended live demo (all real, all on Mezo testnet):**
Borrow MUSD → Delegate to an agent → Settle two actions (watch the budget draw down and the fee land in Earn) → Revoke (remainder refunds, further settles revert) → show the locked bridge transfer. This is the whole flywheel with real transactions. Keep a recorded run as a fallback.

---

## App surfaces

A sidebar **Mainnet/Testnet** toggle switches the cross-chain pages between read-only mainnet data and live testnet actions.

- **Overview** `/app` — live BTC / MUSD / MEZO balances.
- **Cross-chain** `/app/bridge` — mainnet: your BTC-like assets on Ethereum/Base; testnet: bridge MUSD to Base Sepolia via StewardBridge.
- **Vaults** `/app/vaults` — mainnet: Aave APYs + positions; testnet: real Aave Base Sepolia deposit/withdraw.
- **Borrow** `/app/borrow` — open a trove, then view/manage it (add/withdraw collateral, repay, borrow more, close).
- **Delegate / Settle / Earn** — fund an operator, meter settlements, watch the fee pool.

---

## Deployed contracts (Mezo testnet)

| Contract | Address |
|---|---|
| StewardEscrow | `0x0231762F2F2285F6ea27Ad456E144C1371e4AF3B` |
| StewardBridge Outbox | `0xa2b457DAb5b0710A5B8063f813e5fbE3A19deb33` |
| MUSD (testnet) | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

The app also uses Mezo's MUSD protocol (BorrowerOperations, TroveManager, PriceFeed, HintHelpers, SortedTroves) — addresses in `night/MEZO_CONTRACTS.md`.

### Contracts
- **StewardEscrow** — `openAgent` (escrow MUSD under budget/cap/expiry), `settle` (operator-only, fee to pool, rest to payee), `topUp`, `revoke` (owner refund), `setFeeConfig`. 11 Foundry tests.
- **StewardBridge** — a trusted **demo** bridge (single relayer, testnet only — not trustless): `BridgeOutbox.lock` on Mezo, `BridgeInbox.release` mints bMUSD on Base Sepolia, `relayer/bridge-relayer.mjs` delivers. 7 Foundry tests.

---

## Run

```bash
cd night && npm install && npm run dev     # http://localhost:3000
```

Optional `night/.env.local`: `NEXT_PUBLIC_MEZO_NETWORK` (testnet|mainnet), `NEXT_PUBLIC_ETH_RPC`,
`NEXT_PUBLIC_BASE_RPC`, `NEXT_PUBLIC_BASE_SEPOLIA_RPC`, `NEXT_PUBLIC_STEWARD_ESCROW`,
`NEXT_PUBLIC_BRIDGE_OUTBOX`.

## Deploy

```bash
cd contracts && forge test
forge script script/Deploy.s.sol        --rpc-url mezo_testnet --private-key $PK --broadcast  # StewardEscrow
forge script script/DeployOutbox.s.sol  --rpc-url mezo_testnet --private-key $PK --broadcast  # Bridge source
forge script script/DeployInbox.s.sol   --rpc-url base_sepolia --private-key $PK --broadcast  # Bridge dest (needs Base gas)
```

---

## Not built yet

- Staking deposits (locking MEZO to claim a share of the fee pool) — Earn shows the live pool only.
- MEZO-denominated settlement — waits on a published MEZO testnet token (settles in MUSD today).
- Bridge is a trusted demo (single relayer); the destination Inbox + relayer await Base Sepolia gas.
- bMUSD isn't Aave-listed, so the bridge→Aave-vault path needs an own ERC-4626 vault on the destination.
