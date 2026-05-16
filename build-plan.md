# Build Plan: Private Credit Data Co-op for DeFi Lending

## Locked product

A private credit data co-op. The user's bank history is the asset they own. An LLM running inside a TEE underwrites loans against an anonymized cohort from the pool. Midnight handles shielded cohort membership, ZK score proofs, and private royalty payouts. A DeFi lending protocol gets a trustworthy borrower score and never sees a single transaction.

Four pillars, all load-bearing:

- **AI**: LLM-in-TEE doing real underwriting judgment (cash-flow reasoning over 12 months of transactions plus a 50-borrower cohort).
- **Datasets**: each user's bank history is a yield-bearing private dataset. Royalties accrue per use.
- **DeFi**: the counterparty is an undercollateralized lending protocol that disburses USDC against a ZK-proven score.
- **Midnight**: shielded cohort membership, ZK proof of `score >= threshold`, private royalty distribution. Three independent points where Midnight is the only chain that makes the mechanic possible.

---

## System surfaces

Three surfaces ship together:

1. **Landing page** (`/`) — marketing site. Scroll-stacked sections. The thing a judge or first-time visitor sees.
2. **App: borrower + contributor portal** (`/app/vault`) — drag-in bank statement, encrypt locally, get underwritten, see contributor earnings, manage policies.
3. **App: mock DeFi lender** (`/app/lend`) — submit ZK proof of credit score, receive simulated USDC loan.

All three live in a single Next.js 15 App Router project.

---

## Landing page spec

### Tech

- Next.js 15 (App Router, RSC where possible)
- Tailwind CSS
- Framer Motion (`useScroll`, `useTransform`) for scroll-tied transforms
- Lenis for smooth scrolling (single global instance)
- `next/font` with Geist or Inter
- No animation libraries beyond Framer Motion + Lenis. No GSAP. Keep bundle small.

### Sections (in render order, all 100vh)

1. **Hero** — product name, one-sentence pitch, primary CTA, ambient gradient/grid background.
2. **Features** — four cards laid out for the four pillars (AI, Datasets, DeFi, Midnight). Each card explains why it is load-bearing in one line.
3. **Stats** — three counters: addressable credit-bureau revenue, undercollateralized DeFi TAM, current Midnight throughput. Numbers count up on enter.
4. **Testimonials** — three quote cards from fictional but realistic personas: a DeFi protocol lead, a privacy-conscious borrower, a Midnight ecosystem advocate. Mark them as illustrative in the footer.
5. **CTA footer** — single primary CTA (Launch App), secondary link (read the whitepaper), and minimal links row (GitHub, X, Discord).

### Scroll-stack technique

The container is `position: relative` with explicit height equal to `sections.length * 100vh`. Each section is `position: sticky; top: 0; height: 100vh`. Stacking comes from natural document order plus an incrementing `z-index` per section (the later, the higher).

For each section, a Framer Motion wrapper reads `useScroll` against the section's own ref and derives:

- `scale`: `1 -> 0.92` over the section's exit range
- `opacity`: `1 -> 0.7` over the same exit range
- `borderRadius`: `0 -> 24px` over the exit range so the receding section feels like a card sliding behind
- `y` on the entering section is implicit because the next sticky section literally moves up under viewport flow

No `translateY` hacks needed on the entering section. The sticky stacking handles it. Only the outgoing section transforms.

### Animation behavior contract

- No snap. Free smooth scroll only.
- Outgoing section scales down and dims; never disappears (next sits on top of it).
- Receding sections accumulate behind the current one with subtle border-radius reveal so the layered feel is visible.
- `prefers-reduced-motion: reduce` disables scale, opacity, and Lenis; falls back to native scroll with static sections.
- Mobile: same stack, reduced scale delta (`1 -> 0.96`) and shorter Lenis lerp to keep performance steady on lower-end devices.
- Target 60 fps on mid-range laptops and recent phones. All transforms must be GPU-accelerated (`transform`, `opacity` only — no layout properties).

### File layout

```
app/
  page.tsx                    landing page composition
  app/
    vault/page.tsx            borrower + contributor portal
    lend/page.tsx             mock lender
  layout.tsx                  font, Lenis provider, global CSS
components/
  landing/
    StackedSection.tsx        sticky + scroll-tied transforms wrapper
    Hero.tsx
    Features.tsx
    Stats.tsx
    Testimonials.tsx
    CTAFooter.tsx
  ui/                         shadcn-style primitives (Button, Card)
lib/
  lenis.tsx                   Lenis React provider
  motion.ts                   shared easing curves + range helpers
styles/
  globals.css                 Tailwind base + reduced-motion fallbacks
```

### Visual direction

- Dark base (`#0a0a0c`), one accent color drawn from the Midnight brand palette, generous whitespace, large display type.
- One subtle texture layer per section (noise, grid, or radial gradient) so layered sections read as distinct planes.
- No emoji. No stock illustrations. Diagrammatic SVGs only where they earn their place (one in Features, optionally one in Stats).

---

## Application architecture

### Browser vault

- IndexedDB stores the encrypted bank statement blob.
- WebCrypto AES-GCM with a key derived from the user's Midnight wallet signature over a static challenge string (no passphrase to remember, no key stored).
- Commitment hash of the ciphertext is registered on Midnight via `VaultRegistry.register_vault`.

### Phala TEE worker

Single endpoint: `underwrite(borrower_vault_capability, cohort_vault_capabilities, query)`.

Inside the enclave:

1. Verify capabilities are signed by the relevant vault owners and not revoked.
2. Decrypt all referenced vaults.
3. Run the underwriting LLM. Prompt template: structured cash-flow analysis plus cohort comparison, output schema enforced via JSON mode or a small open-weights model with grammar-constrained decoding.
4. Produce `{score, monthly_income_bucket, debt_service_ratio, reasoning_hash, cohort_pubkeys, attestation}`.
5. Sign with the TEE attestation key.

Return only the structured result and attestation. Raw transactions never leave the enclave.

### Midnight Compact contracts

Three contracts:

- **VaultRegistry**: `register_vault`, `authorize_agent(agent_pk, query_type_hash, expiry, max_uses)`, `record_query(agent_pk, query_hash, answer_commitment, payment)`, `revoke`.
- **CreditPool**: `opt_in(vault_commitment, policy_hash)`, `select_cohort(query_filter) -> shielded_cohort_handle`, `distribute_royalty(cohort_handle, payment)`. Cohort selection happens with zero-knowledge predicates so the lender and the borrower do not learn cohort members.
- **ScoreProof**: verifier circuit accepting a proof that `score >= threshold AND debt_service_ratio <= ceiling AND cohort_size >= min` issued against an attested underwriting result. Called by the lender contract before disbursing the loan.

### Mock DeFi lender contract

Plain Compact contract with one entry point `borrow(amount, score_proof)`. Verifies the `ScoreProof` and transfers mock USDC. Purely to make the demo executable.

---

## Build sequence

Order matters because the landing page is the demo backstop. If anything else slips, the landing page plus the recorded demo video carries the story.

1. **Landing page first.** Hero, Features, Stats, Testimonials, CTA footer with the full scroll-stack animation. Deployable to Vercel before any contract work is written.
2. **VaultRegistry contract** on Midnight testnet. Single-user path: register, authorize, record_query, revoke. Exercised from CLI before any frontend wiring.
3. **Phala TEE worker (single-borrower mode).** Just decrypt one vault, run the LLM, return attested score. No cohort yet.
4. **Borrower frontend at `/app/vault`.** Drag-drop bank statement, encrypt, register, request underwriting, display result.
5. **Lender frontend at `/app/lend`.** Wire up the wallet, generate `ScoreProof`, submit to mock lender contract, show disbursement.
6. **CreditPool contract.** Opt-in + cohort selection + royalty distribution.
7. **TEE worker upgrade to cohort mode.** Pull N cohort capabilities, run cohort-aware underwriting prompt, emit per-contributor royalty list.
8. **Contributor dashboard** as a tab inside `/app/vault`. Earnings, policy controls, attested usage log.
9. **Polish + demo prep.** Synthetic dataset for the live attempt, real-data screen recording as the fallback, README that reads in 60 seconds.

If anything in steps 6 through 8 slips, ship the single-borrower version. The co-op story still works as a slide-2 narrative even if the contributor side is mocked in the recording only.

---

## Risks

1. **Selective-disclosure proof for cohort membership.** Compact circuits for set membership without revealing the member are the hardest cryptographic piece. Time-box the first attempt; if it does not compile in one focused block, fall back to public cohort identity for the demo and flag it as a known v2 hardening item.
2. **Phala plus Midnight has no template.** The attestation-signature to Compact-verifier glue is bespoke. Expect this to consume more elapsed time than the headline TEE work.
3. **LLM choice inside the TEE.** Running a real model inside the enclave is slow without GPU passthrough. For the demo, either (a) call a remote model from inside the TEE with an attested transport, or (b) run a small open-weights model and accept slower inference. Document the tradeoff in the README; do not bluff that this is production-grade.
4. **Bank statement schemas vary.** Pick one canonical format (Plaid CSV export) and reject everything else for the demo. Generic parsing is a rabbit hole.
5. **Wallet UX on testnet.** Midnight DApp Wallet is new. The live demo has to assume one wallet popup will misbehave; the recorded version is the unconditional fallback.
6. **Landing page performance regression on mobile.** Scroll-tied transforms can drop frames on older devices. Mitigate with reduced-motion-aware fallbacks and conservative scale ranges on small viewports. Test on a real mid-range Android, not just Chrome devtools throttling.

---

## What gets cut first if the build is on fire

In order, last in first out:

1. Contributor dashboard UI (keep the contract, drop the page).
2. Royalty distribution on chain (mock it in the recording).
3. Third query type or any extra surface beyond underwriting.
4. Live demo with synthetic data (play the recorded video only).
5. Testimonials section on the landing page (it is the least load-bearing section).

What never gets cut: the four-pillar Features section, the borrower end-to-end flow, the ZK score proof being verified by the lender, the wallet popup, and the network-tab moment showing ciphertext-only egress.
