const pillars = [
  {
    tag: "01 · Scope",
    title: "A policy you signed, on chain",
    body: "Before the agent runs, you commit a scope to Midnight: which data sources it can read, which actions it can take, for how long, with what spend ceiling. The agent cannot operate outside that commitment.",
    detail: "Bytes you control. Not a checkbox in a settings page.",
  },
  {
    tag: "02 · TEE",
    title: "The agent runs sealed",
    body: "Execution happens inside a remote attested enclave. The model never sees more than the policy allows. Inputs, outputs and the model identity are bound to an attestation key that Midnight can verify.",
    detail: "No company-running-the-agent handshake. Cryptographic.",
  },
  {
    tag: "03 · Audit",
    title: "Every query leaves a receipt",
    body: "For each call the agent makes, a hash of the question, a commitment to the result and the payment are recorded on Midnight. You see what it did. You can prove it to anyone, without leaking the underlying data.",
    detail: "On-chain provenance. Off-chain privacy.",
  },
  {
    tag: "04 · Revoke",
    title: "One transaction kills it",
    body: "Mid-session, you revoke. The next query the agent attempts fails its on-chain authorization check. The chain itself enforces termination — not a polite ask to a backend service that may or may not honor it.",
    detail: "Enforcement, not best-effort.",
  },
] as const;

export function Features() {
  return (
    <div className="relative h-full w-full" style={{ background: "#0f5a37", color: "#e8f0d8" }}>
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 py-16 sm:px-10 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(230, 238, 91, 0.55)" }}>
              Four pillars
            </div>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl tracking-tight sm:text-6xl" style={{ color: "#e8f0d8" }}>
              Scope. Seal. Log. Revoke.
              <br />
              <span style={{ color: "rgba(230, 238, 91, 0.55)" }}>Pull one out, the trust model collapses.</span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-6 sm:block" style={{ color: "rgba(230, 238, 91, 0.65)" }}>
            Delegated agents only work if every action is bounded, attested,
            logged and reversible. Without all four, you are just trusting a
            vendor.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-px overflow-hidden rounded-2xl sm:grid-cols-2" style={{ background: "rgba(232, 240, 216, 0.18)" }}>
          {pillars.map((p) => (
            <article
              key={p.tag}
              className="group relative flex flex-col justify-between gap-6 p-7 transition-colors sm:p-9"
              style={{ background: "#0a3a25" }}
            >
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#9ec591" }}>
                  {p.tag}
                </div>
                <h3 className="mt-3 font-serif text-2xl tracking-tight" style={{ color: "#f4f6e6" }}>
                  {p.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7" style={{ color: "rgba(244, 246, 230, 0.8)" }}>
                  {p.body}
                </p>
              </div>
              <div className="font-mono text-xs" style={{ color: "rgba(158, 197, 145, 0.85)" }}>
                {p.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
