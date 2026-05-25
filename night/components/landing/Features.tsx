const pillars = [
  {
    tag: "01 · Borrow",
    title: "Mint MUSD against your Bitcoin",
    body: "Deposit BTC, draw MUSD against it. You keep your Bitcoin and unlock dollars to put to work. This is Mezo's core banking primitive — no sale, no taxable event, no handing your coins to a custodian.",
    detail: "Spending power without selling a sat.",
  },
  {
    tag: "02 · Delegate",
    title: "Fund a scoped agent",
    body: "Allocate that MUSD to a Mex — an AI agent that acts on your behalf inside a budget and a policy you set. It manages, rebalances and pays, but only within the scope you allow.",
    detail: "A budget, not your keys.",
  },
  {
    tag: "03 · Settle",
    title: "Every action settles in MEZO",
    body: "The agent pays per action in MEZO with dynamic fees — metered usage, not a flat subscription. Each settlement is an on-chain transaction you can read back. You see exactly what it did and what it cost.",
    detail: "Metered. On chain. Auditable.",
  },
  {
    tag: "04 · Earn",
    title: "Stake the fees, earn the yield",
    body: "The MEZO the agent spends streams into a staking pool. Stake MEZO to earn yield from real agent activity and unlock loyalty fee discounts. Payments fund staking; staking discounts payments.",
    detail: "The loop closes on itself.",
  },
] as const;

export function Features() {
  return (
    <div className="relative h-full w-full" style={{ background: "#0f5a37", color: "#e8f0d8" }}>
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 py-16 sm:px-10 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(230, 238, 91, 0.55)" }}>
              The Mex loop
            </div>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl tracking-tight sm:text-6xl" style={{ color: "#e8f0d8" }}>
              Borrow. Delegate. Settle. Earn.
              <br />
              <span style={{ color: "rgba(230, 238, 91, 0.55)" }}>One loop, and it pays for itself.</span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-6 sm:block" style={{ color: "rgba(230, 238, 91, 0.65)" }}>
            Each step funds the next. The MEZO an agent spends becomes the yield
            a staker earns, which becomes the discount on the next action.
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
