<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project: Omnis — Revocable Delegated AI Agents on Midnight

A scoped AI agent that acts on your behalf inside a TEE under a policy you sign on Midnight. Every query the agent makes is recorded on chain. Revoke any time and the chain enforces termination.

Pivoted on 2026-05-17 from a private credit data co-op framing. All credit / lending / cohort / CSV / underwriting code is gone; theme, layout, sidebar pattern and the sage palette were kept. See [[project-midnight-vault]] in memory for the pivot rationale.

## Demo loop

1. User picks an agent template on `/app/agents`, sets scope (sources + filters), expiry (days), max queries, spend ceiling.
2. Wallet signs the policy. `AgentRegistry.register_agent` + `set_policy` land on Midnight. The agent receives a capability bound to that policy hash.
3. The agent runs inside a TEE. Each query attempts `AgentRegistry.is_authorized?(agent_id, scope_hash, query_hash)` and only executes if the chain accepts.
4. Successful queries record `log_query(query_hash, result_commitment, payment)` on chain. Raw inputs and outputs stay inside the TEE.
5. User calls `revoke_agent` mid-session. The next query attempt fails before execution. Chain proves termination.

## Why Midnight (the load-bearing argument)

Without on-chain authorization receipts, the whole trust model is a handshake with whatever company is running the agent. They can claim revocation; you have no way to prove it happened. They can claim scope enforcement; you have no way to prove a query was rejected. Midnight makes the policy a transaction, the scope a verifiable commitment, and revocation an event that other parties can rely on. Public chains can't carry the query receipts privately. Off-chain signers can't carry enforcement publicly. Midnight does both.

## Current state (2026-05-17)

**What's real:**
- Next.js 16 App Router + React 19 + Tailwind 4 (Spade-inspired sage + forest + black palette)
- Five-section stacked landing (`Hero`, `Features`, `Stats`, `Testimonials`, `CTAFooter`) via `StackedSection.tsx` — rewritten to the agent thesis
- Five app routes wrapped in `AppShell` + `Sidebar`:
  - `/app/agents`   — `AgentConsole`: template + policy form + register + simulate + revoke
  - `/app/policies` — view the active policy: scopes, expiry, spend ceiling, hash
  - `/app/activity` — list of query receipts (allowed + rejected) with tx hashes
  - `/app/demo`     — three scripted scenarios: in-scope · out-of-scope · post-revoke
  - `/app/audit`    — unified provenance feed (register / policy / query / rejection / revoke)
- `localStorage` persistence for the active agent and query receipts (`Omnis:agent:v1`, `Omnis:queries:v1`)

**What's still mocked (`lib/mock.ts`, `lib/agents.ts`):**
- `shortHash` stands in for chain commitments and tx hashes
- `register_agent` / `set_policy` / `log_query` / `revoke_agent` produce synthetic hashes — no real Midnight call yet
- TEE attestation is a string; no Phala attestation key yet
- No Lace wallet integration yet — wallet detection / connect / sign is the next piece to ship

## Visual identity (unchanged from pre-pivot)

Theme is Spade-inspired pale sage + forest green + near-black. Defined in `app/globals.css`:

```css
--background: #e8f0d8   /* pale sage  */
--foreground: #0d0d0d   /* near-black */
--accent:     #0f5a37   /* forest green (CTAs, accents only) */
--surface:    #f4f6e6   /* warm off-white cards */
--surface-2:  #eef2dc
```

**Landing section contrast rhythm:**

```
Hero          #e8f0d8   pale sage    ← brand entry
Features      #0f5a37   forest green ← inverted, dramatic
Stats         #f7f9ef   off-white    ← calm, lets numbers breathe
Testimonials  #0d0d0d   near-black   ← weighty quotes
CTAFooter     #e8f0d8   pale sage    ← bookend
```

The contrast pattern (sage → forest → cream → black → sage) is the reason this landing reads as a real fintech product. Don't unify the section colors. The components use **inline `style={}` overrides**, NOT Tailwind tokens, because tokens swap globally — the explicit hex codes in each section file are the source of truth.

Hero uses **serif headline** (Georgia via `.font-serif`) with a scattered icon cluster on the right — see `Hero.tsx`'s `IconCluster` (9 chips, sizes 50–76px). Chip palette is restrained sage/forest/black/cream + one terracotta accent (`#c97a4a`). No saturated blues or bright greens.

## File map

```
app/
  globals.css                — theme tokens (Spade palette)
  layout.tsx                  — root layout, fonts, Lenis
  page.tsx                    — stacked landing
  app/
    agents/page.tsx           — AgentConsole route
    policies/page.tsx         — active policy viewer
    activity/page.tsx         — query receipts log
    demo/page.tsx             — three-scenario enforcement demo
    audit/page.tsx            — unified provenance feed

components/
  landing/
    Hero.tsx                  — "Delegate the agent. Never the keys."
    Features.tsx              — 4 pillars: Scope / TEE / Audit / Revoke
    Stats.tsx                 — agent-relevant numbers
    Testimonials.tsx          — three personas, agent framing
    CTAFooter.tsx             — bookend sage
    StackedSection.tsx        — scroll-stacked wrapper, Lenis-compatible
    Counter.tsx               — animated count-up
  app/
    AppShell.tsx              — wraps in SidebarProvider + Sidebar + content
    Sidebar.tsx               — 5 nav items: Agents / Policies / Activity / Demo / Audit
    AgentConsole.tsx          — template + policy + register + simulate + revoke
    StepFlow.tsx              — animated multi-step progress (kept from pre-pivot)
  ui/
    Button.tsx                — primary/secondary/ghost variants
    Card.tsx

lib/
  agents.ts                   — Agent / Policy / Scope types + localStorage helpers
  mock.ts                     — shortHash + sleep (placeholder until Midnight wired)
  lenis.tsx                   — Lenis React provider
  motion.ts                   — shared easing curves + range helpers
```

## App IA

```
Sidebar nav (top to bottom)
  · Agents     → /app/agents     create + manage active agent
  · Policies   → /app/policies   read the scope bound to the active agent
  · Activity   → /app/activity   query receipts (allowed + rejected)
  · Demo       → /app/demo       three-scenario chain enforcement demo
  · Audit      → /app/audit      unified provenance feed
```

240px expanded, 56px collapsed, active item gets `border-l-2` + ▶ glyph. Bottom bar has a chain pill (`midnight · live`) + collapse toggle. The chain pill will be replaced with a real wallet connect chip when Midnight integration ships.

## Midnight integration plan (in shipping order)

1. **Install SDK + Next config**: `@midnight-ntwrk/midnight-js-contracts`, `midnight-js-types`, `midnight-js-network-id`, `midnight-js-http-client-proof-provider`, `midnight-js-indexer-public-data-provider`, `midnight-js-utils`, `ledger-v6`, `compact-runtime`, `dapp-connector-api`. WASM tweaks in `next.config.ts`.
2. **Lace wallet provider** in `lib/midnight/wallet.tsx`: poll `window.midnight.mnLace`, semver-check connector API version, expose `connect()` / `disconnect()` / `status` / `address` / `api`. SSR-safe, persists across reloads.
3. **Provider bundle** in `lib/midnight/providers.ts`: build proof, indexer, public-state, wallet/midnight providers from `api.serviceUriConfig()`. Pin network to testnet via `setNetworkId(NetworkId.TestNet)`.
4. **AgentRegistry Compact contract** at `contracts/agent-registry/src/agent-registry.compact`. Four circuits:
   - `register_agent(agent_pk, owner_commitment)`
   - `set_policy(agent_pk, scope_hash, expiry, max_queries)`
   - `log_query(agent_pk, query_hash, result_commitment)`
   - `revoke_agent(agent_pk)`
   Ledger: `Map<Bytes<32>, Agent>`, `Set<Bytes<32>> revoked`, query receipt list. Reference: `seabattle`, `proofshare`, `nel349/midnight-bank`.
5. **Compile + wire AgentConsole**: replace synthetic `shortHash` calls in `register / set_policy / log_query / revoke` with real `deployContract` / `findDeployedContract` → `callTx.*`. Persist contract address per agent.
6. **Audit page reads ledger**: indexer subscription on `AgentRegistry` contract address, list registrations / authorizations / queries / revocations with real tx hashes + block heights.

## Hackathon constraints to respect

- **Ship the visible loop first; gate later.** Every protection layer added in advance becomes a debugging surface during the demo. Wallet integration is the first real-chain piece; contract wiring comes after.
- **Agents page, Demo page, Audit page** are the three surfaces a judge sees first. Disproportionate polish budget belongs there.
- **The receipts ARE the privacy proof, visually.** When a judge asks "how do I know the agent actually got revoked?" the answer is the Audit feed — the revocation event sits there with a real tx hash. Without on-chain receipts, the revocation claim feels abstract.
- See `feedback_demo_strategy.md` in memory: hybrid demo — pre-recorded with real data, live attempt with synthetic data. Don't skip either side.

## Sandbox note

`Bash` resets cwd on every call in this sandbox; pass absolute paths or `cd /home/daiwi/mid/night &&` prefix. `npm run dev` and `tsc -p /home/daiwi/mid/night` work fine when invoked correctly. Smoke-test by booting `npm run dev` in your own terminal.
