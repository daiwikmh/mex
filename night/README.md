# Omnis

Revocable delegated AI agents on Midnight. Every query the agent runs is authorized on chain before execution. Revoke at any time — the chain proves it happened.

---

## What works

### Agent registration on Midnight
Pick a template (Invoice triage, Spend watcher, Calendar defender, Vendor map), set a spend ceiling, expiry, and query limit, then register. Two transactions land on Midnight preview testnet: `register_agent` commits the agent identity and owner binding; `set_policy` commits the scope hash, expiry, and limits. The agent gets a policy hash and a contract address — both verifiable on chain. Contract: `0a12f542b20cb3e445cff3fe9e3242383e42e82c3d26a94a64cd24915a8c26d6`.

### Revocation
One click fires `revoke_agent` on chain. The agent is immediately marked revoked in the UI. Every subsequent query attempt is blocked before it executes. The revocation sits in the Audit feed with a real tx hash — that is the proof, not a promise.

### Data source connectors
Four connectors: Gmail, Google Calendar, Finance (Stripe), Google Drive. Toggle any on and its data enters the knowledge graph instantly — 8 email nodes, 5 invoices, 4 charges, 4 meetings, 4 documents. Toggle off and those nodes disappear from chat context. Each connector is scoped at connection time: Gmail is read-only, Finance cannot move funds, Calendar cannot write.

### Knowledge graph
29 nodes across 6 types — Contact, Email, Invoice, Charge, Meeting, Document — linked by 8 edge types: `sent_by`, `sent_to`, `attached_to`, `attended_by`, `charged_for`, `mentions`, `follows_up`, `paid`. Every node is source-tagged (gmail / calendar / finance / drive). Private nodes (personal emails, physio appointments, tax notes) are excluded from all agent traversals regardless of scope.

### Graph traversal with scope enforcement
The Graph page runs live traversal from a seed node outward. Each hop is checked against the active agent's policy scope — node type, edge type, max depth. Allowed hops light up; out-of-scope hops are shown in red with the block reason. The scope hash is computed live from the current selection and matches what was committed on chain. This is the TEE boundary made visual.

### Chat grounded in the knowledge graph
The Chat page accepts natural-language questions and answers from the live KG context — only nodes from connected sources, private nodes excluded. With `ANTHROPIC_API_KEY` set, Claude Haiku generates answers grounded strictly in the graph context (no hallucinated data). Without it, structured answers are generated directly from matching nodes and edges. Conversation history is preserved per session.

### Query receipts
Every allowed query produces a receipt: query hash, result commitment, payment amount, timestamp, and tx hash. Rejected queries are also logged — out-of-scope attempt and reason. These are the on-chain audit entries visible on the Audit page.

### Wallet integration
Lace wallet connect via the Midnight dApp connector API. The WalletChip in the sidebar shows connection status, shielded address, and live tDUST balance. All transaction signing goes through Lace — no private keys touch the app.

---

## Integrations

| Layer | What |
|---|---|
| Midnight preview testnet | `register_agent`, `set_policy`, `log_query`, `revoke_agent` circuits |
| Lace wallet | dApp connector v4, proof generation, tx signing, balance |
| Midnight indexer | Public data provider for contract state reads |
| Claude Haiku | KG-grounded chat answers (requires `ANTHROPIC_API_KEY`) |
| Gmail | Email nodes: sender, recipient, subject, date |
| Google Calendar | Meeting nodes: title, attendees, start time |
| Finance (Stripe) | Invoice and Charge nodes: amount, status, due date |
| Google Drive | Document nodes: title, page count, type |

---

## Knowledge graph schema

```
Nodes
  Contact   — name, role, org
  Email     — subject, date                  source: gmail
  Invoice   — amount, due date, status       source: finance
  Charge    — amount, status                 source: finance
  Meeting   — title, start, attendees        source: calendar
  Document  — title, pages, type             source: drive

Edges
  sent_by        Email → Contact
  sent_to        Email → Contact
  attached_to    Invoice → Email, Charge → Email
  charged_for    Charge → Invoice
  paid           Charge → Contact
  attended_by    Meeting → Contact
  mentions       Meeting → Invoice, Document → Contact, Document → Invoice
  follows_up     Email → Email
```

Traversal enforces node type allow-list, edge type allow-list, and max depth — all from the policy the agent registered on chain. A node whose type is not in the agent's `kgScope.nodes` is rejected at the hop, never fetched.
