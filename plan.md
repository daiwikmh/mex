
  "What to build" is too open. The real question is: what's the smallest project that proves the Midnight thesis ("powerful AI without exposing personal
  data") AND lands in 1-3 days for a hackathon judge to see and remember?

  Two things must be visible in 90 seconds:
  1. A user putting in real, recognizable private data (so the privacy claim is felt, not abstract)
  2. A counterparty acting on a trustworthy AI output without seeing the data (so the "without exposing" claim is felt)

  Most Midnight demos do (1) but skip (2) — they show "data is encrypted" then nothing happens. The point of Midnight is the counterparty trusts the result
  without seeing the input. Build the demo around the counterparty.

  My pick: Private KYC + selective disclosure for crypto access

  A user uploads passport + selfie. A TEE-based AI verifies (OCR + face match + sanctions check). Midnight issues a shielded credential. Later, the user
  proves to any DEX/DApp "I'm KYC'd, not on sanctions, jurisdiction X" — without revealing their identity, document, or face.

  Why this and not the alternatives I considered

  - Loan approval (upload bank statements, get pre-qualified): more universal pain, but lender doesn't need the proof on-chain. Centralized lenders prefer
  their own black-box. Weaker fit for Midnight.
  - Private health/therapy AI: emotionally resonant, but "AI on my journal entries" is hard to demo without it feeling slow + intimate-cringe in front of
  judges.
  - Private resume matching: good story, but recruiters don't actually want to hire from anonymous pools. Adoption story is weak.
  - KYC wins because: (a) every crypto judge has done KYC and hated it, (b) the counterparty (DEX) has a forced compliance need, so the
  verifiable-without-revealing angle is load-bearing, not decorative, (c) Midnight's selective disclosure is the perfect primitive for this exact problem.

  It's also the closest thing to a real B2B sale path. Worldcoin, Persona, Sumsub all charge real money for KYC and zero of them give the user data privacy.
   There's a wedge.

  Stack (1-3 day build)

  ┌─────────────┬───────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────┐
  │    Layer    │                            Choice                             │                                 Why                                  │
  ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ TEE compute │ Phala Network agent                                           │ TS SDK, attestations integrate cleanly, Cardano/Midnight-friendly    │
  │             │                                                               │ community                                                            │
  ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ AI models   │ OCR (Tesseract or PaddleOCR), face match (InsightFace),       │ All small enough to run in a TEE, all open-source                    │
  │             │ sanctions list (OFAC SDN local copy)                          │                                                                      │
  ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Smart       │ Midnight Compact: KycCredential                               │ Two functions: issue(attestation, encrypted_creds_ref),              │
  │ contract    │                                                               │ prove(predicate) returning shielded event                            │
  ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Frontend    │ Next.js + Midnight DApp Wallet SDK                            │ Split into two routes: /verify (user uploads), /swap (mock DEX that  │
  │             │                                                               │ requires KYC proof)                                                  │
  ├─────────────┼───────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Storage     │ Encrypted blob → Arweave or IPFS, hash on Midnight            │ Standard pattern; data persists, only ciphertext public              │
  └─────────────┴───────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────┘

  Demo (90s)

  Beat 1 — the user (20s)
  - Open /verify. Upload sample passport image + take selfie. Hit "verify."
  - Status flashes: "encrypting → sending to TEE → AI verifying → issuing credential."
  - Done: "Credential issued. Stored shielded on Midnight."

  Beat 2 — the data is gone (15s)
  - Open browser devtools network tab. Show: only ciphertext + a TEE attestation hash leaves the browser. No PII in any request body. Show the Midnight tx —
   only a commitment hash visible on chain.

  Beat 3 — the counterparty (40s)
  - Switch to /swap (mock DEX). Click "Swap $50k USDC → ETH."
  - DEX modal: "Compliance required. Prove you have a valid KYC credential issued within 90 days, residence not in [sanctioned list], age 18+."
  - User clicks "Generate proof." Midnight wallet pops up. ZK proof generated locally. Submitted on chain.
  - DEX checks contract: ✓. Swap proceeds.
  - Show DEX's view: candidate 0xa3f…87b · KYC valid · no other data. No name, no face, no document, no country.

  Beat 4 — the punchline (15s)
  - "DEX got the compliance it needs. The user kept their identity. The AI ran on their data exactly once, in a TEE, and the result was a single yes/no
  committed on chain. This is what 'powerful AI without exposing data' looks like in practice."

  Time budget for 1-3 days

  - Day 1 (8 hrs): Phala TEE agent doing OCR + face match + sanctions, hitting hello-world. Midnight Compact contract deployed on testnet, manually tested
  via CLI.
  - Day 2 (8 hrs): wire them together: TEE attestation → Compact verification → shielded credential issuance. User-side proof generation working end-to-end.
  - Day 3 (8 hrs): build the two-route frontend, prepare sample passports + selfies, record demo, write README + pitch.

  If you only have 1 day, mock the TEE (run AI in normal Node, claim attestation came from TEE) and focus on the Midnight + selective disclosure flow. Be
  honest about it in the README. The Midnight part is the real moat for the prize.

  Risks

  - Compact DSL learning curve. Allocate Day 1 morning purely to Compact tutorial. Don't try to write the contract from scratch on Day 2 with one example to
   crib from.
  - Phala SDK + Midnight don't have a pre-built integration template. You'll be writing the attestation→verification glue. Plan for it.
  - Face match libraries (InsightFace) need GPU for speed. Inside a TEE without GPU passthrough this is slow. Acceptable for 1-user demo; would need work
  for production. Demo-acceptable, mention as "scaled with GPU TEE next."
  - Sanctions list is regulatory data. For demo, use a known-public OFAC SDN list. Don't claim production-grade compliance; claim "demonstrable compliance
  check pattern."
  - Trust assumption judges WILL ask: who runs the TEE? Who issues the original credential? Be prepared with: "for hackathon, we are; in production, a
  regulated KYC provider runs the TEE attached to their existing license."

  Alternatives if this doesn't fit your vibe

  - Private salary verification for landlords/employers (similar shape, less crypto-native)
  - Private medical eligibility for clinical trials (powerful narrative, harder demo)
  - Private credit score for under-banked DeFi borrowers (very crypto-native, simpler than KYC)

  ---
  Want me to write the same level of plan for one of those alternatives? Or — pick this and I'll write the 3-day build plan with the same hour-by-hour
  structure I gave for the OG Times upload feature.

✻ Baked for 2m 19s

❯ can we somethign around data sets

● DIAGNOSIS — "datasets" splits into 4 different products

  Before picking, the word "datasets" has to resolve. Each variant is a different build and a different judge story:

  1. Marketplace (sellers list datasets, buyers train on them blindly) — B2B, two-sided, hardest demo
  2. Vault (one user's private datasets, AI agents pay to query specific facts) — consumer, single-user demo, viscerally relatable
  3. Federated training (many users contribute, model trains on combined pool, each gets royalty) — high concept, hardest to fit in 3 days
  4. Eval / benchmark (model creators submit models, scored against private benchmarks) — niche, judge-memorable only if judge is an ML person

  For a 1-3 day Midnight hack with mixed-background judges, only #2 produces a demo where the judge feels the privacy claim. The rest are abstract value
  transfers. Pick #2.

  My pick: "Personal Data Vault + Pay-Per-Query AI Agents"

  The pitch in one sentence

  Your private data (location, calendar, finances, health) lives encrypted in your local vault; AI agents pay you DUST per typed question; the agent gets a
  yes/no or a number, never the raw data; every query and payment is auditable on Midnight, revocable any time.

  Why this beats the alternatives

  - The user does the data dump. Drop in your real Google Takeout location history. Real personal data on screen → instant felt privacy stakes.
  - The AI does something visibly useful. Not "here's a score," but "here are events near where you usually stay this week." Judges get it without
  explanation.
  - The counterparty needs Midnight. Without selective disclosure + on-chain payment, this can't exist. The chain isn't decoration.
  - Single-user demo. Two browser tabs (you + the agent app) — no second wallet, no multi-actor coordination on stage.
  - Spawns a real product. "iOS Health for AI" / "Solid Pods done right" — a plausible startup wedge if anyone wanted to fund it.

  Stack (1-3 day build)

  ┌──────────────┬───────────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
  │    Layer     │                                      Choice                                       │                       Why                        │
  ├──────────────┼───────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Vault        │ Local IndexedDB (encrypted with WebCrypto AES-GCM) + hash on Midnight             │ Vault is genuinely local; Midnight only sees     │
  │ storage      │                                                                                   │ commitments                                      │
  ├──────────────┼───────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Query        │ Phala TEE worker, single endpoint query(vault_capability, question)               │ TEE decrypts vault inside enclave, runs typed    │
  │ execution    │                                                                                   │ query, returns answer + attestation              │
  ├──────────────┼───────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Smart        │ Midnight Compact: vault_register, agent_authorize(agent_pk, policy),              │ All shielded. Selective disclosure is the agent  │
  │ contract     │ query_record(agent, q_hash, answer_hash, payment), revoke(agent)                  │ proving it has authorization.                    │
  ├──────────────┼───────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Frontend     │ Next.js, two routes: /vault (your data + audit log + policies), /eventapp (mock   │ Two-tab demo without two separate apps           │
  │              │ agent that demonstrates the query flow)                                           │                                                  │
  ├──────────────┼───────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Sample data  │ Real Google Takeout location JSON, real Apple Health export, real Mint/CSV        │ Free for the user to download; instantly         │
  │              │ financial export                                                                  │ recognizable to judges                           │
  └──────────────┴───────────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘

  Pre-baked query types (for hackathon demo)

  Don't build a generic query language. Hard-code 6 query types:

  1. cityVisited(city, days_back) → bool
  2. totalSpent(category, days_back) → number_bucketed
  3. eventsAttended(category, days_back) → count
  4. avgSleep(days_back) → hours_bucketed
  5. incomeBucket() → bucket_string
  6. frequentLocations(top_n) → list_of_city_names

  Each typed question gets a specific TEE handler. Easier to validate correctness, easier for judges to follow.

  Demo (90s)

  Beat 1 — set up the vault (15s)
  - Open /vault. Drag in your Google Takeout Location History.json.
  - Status: "14,231 location points imported · encrypted with your key · stored locally · vault hash committed to Midnight"
  - Show the hash + tx link.

  Beat 2 — agent comes knocking (15s)
  - Switch to /eventapp tab. "Welcome to EventApp! We need to know if you're a frequent NYC visitor to recommend events."
  - Modal: "EventApp wants to query your vault: cityVisited(NYC, 90). Cost: 0.01 DUST per query. Authorize?"
  - Click "Authorize for this query type, this agent, expires in 7 days."

  Beat 3 — the query (20s)
  - EventApp page now shows: "Querying vault... TEE attestation received... Result: yes, 3 visits."
  - Below: "Recommended events: ETHGlobal NYC, BrooklynChain Meetup, Stark Conference."
  - Open browser network tab: show that only ciphertext + an attestation hash + a Midnight tx left the device. The location data itself never left.

  Beat 4 — your audit + control (25s)
  - Back to /vault. Show the audit log: "EventApp asked cityVisited(NYC,90) · returned bucketed answer · paid 0.01 DUST · timestamp · trace hash."
  - Click "Revoke EventApp." Confirm in wallet.
  - Switch to EventApp tab, refresh. "Access revoked. We can no longer query your vault."

  Beat 5 — punchline (15s)
  - "EventApp got what it needed to recommend useful events. I never gave them my location data. The chain proves the AI ran on my data exactly once, paid
  me, and respected my revocation. This is what 'powerful AI without exposing data' looks like as a product, not a slide."

  Time budget (1 day / 2 day / 3 day cuts)

  - 3 days (full): vault + 3 query types + 2 mock agents + audit + revocation + payments + polish + recording
  - 2 days: vault + 2 query types + 1 mock agent + audit + payments. Skip revocation UI.
  - 1 day: vault + 1 query type + 1 mock agent. Mock the TEE (run query in plain Node, claim attestation). Honest in README.

  Risks

  - Compact selective disclosure proofs. This is where Midnight earns its place but it's also the hardest part. Allocate a full half-day to getting one
  shielded credential proof working before scaling.
  - TEE query handler scope creep. Every judge will want to ask "but can it answer arbitrary questions?" Answer: "Today, 6 typed questions; tomorrow, an
  LLM-in-TEE generalizes." Don't actually try to ship the LLM-in-TEE in 3 days.
  - DUST-as-payment UX. Midnight wallet payment per query may feel clunky. Mitigation: pre-fund a "query allowance" of 1 DUST, deduct off-chain inside TEE
  bounds, settle batch on-chain at end of session. Document that as a "real production" detail and just show single-tx payment in demo.
  - "Why not just run the AI locally on my laptop?" is a question a smart judge asks. Answer: counterparty trust — EventApp can't prove its recommendations
  weren't manipulated by the user without an attested run. Midnight + TEE solves that.
  - Sample data that survives demo. Personal location histories include home addresses. Use a synthetic but realistic Google Takeout JSON for the demo so
  you don't doxx yourself on stage.

  Alternative trims if you'd rather

  - "Royalty Tracker for shared datasets" — same primitives, B2B framing, simpler demo. But less viscerally felt.
  - "Private RAG" — upload a folder of PDFs, ask LLM questions, RAG runs in TEE so the underlying docs never leak. Best for enterprise legal/compliance
  buyer; demo is single-user.
