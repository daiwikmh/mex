const pillars = [
  {
    tag: "01 · AI",
    title: "An LLM that actually underwrites",
    body: "Inside a Phala TEE, a model reads twelve months of cash flow and compares against a fifty-borrower cohort. Reasoning never leaves the enclave. Only the score, the bucket, and an attestation come out.",
    detail: "Attested. Auditable. No black-box prompt leakage.",
  },
  {
    tag: "02 · Datasets",
    title: "Your statement is a yield-bearing asset",
    body: "Encrypted in your browser, registered as a commitment on Midnight, opted-in to the credit pool. Each time it informs an underwriting, royalties are paid to its owner privately.",
    detail: "You set the policy. You revoke at any time.",
  },
  {
    tag: "03 · DeFi",
    title: "Undercollateralized USDC, on score alone",
    body: "The counterparty is a lending contract that disburses against a ZK-proven credit score. No transaction history requested. No KYC dump. Just the proof and the wallet.",
    detail: "Score is verified on-chain, not handed off.",
  },
  {
    tag: "04 · Midnight",
    title: "Three points where only Midnight fits",
    body: "Shielded cohort membership. Zero-knowledge proof that score ≥ threshold. Private royalty distribution to contributors whose data was used. Public chains can't keep these three private at once.",
    detail: "Compact circuits, mainnet-grade primitives.",
  },
] as const;

export function Features() {
  return (
    <div className="relative h-full w-full bg-surface">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
      <div className="noise" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 py-16 sm:px-10 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              Four pillars
            </div>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Each one load-bearing.
              <br />
              <span className="text-foreground/60">Pull one out, the demo dies.</span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-6 text-foreground/55 sm:block">
            The product only ships if AI, Datasets, DeFi, and Midnight all
            carry weight. No decorative integrations.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {pillars.map((p) => (
            <article
              key={p.tag}
              className="group relative flex flex-col justify-between gap-6 bg-surface p-7 transition-colors hover:bg-surface-2 sm:p-9"
            >
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-accent">
                  {p.tag}
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.01em]">
                  {p.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-foreground/70">
                  {p.body}
                </p>
              </div>
              <div className="font-mono text-xs text-foreground/50">
                {p.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
