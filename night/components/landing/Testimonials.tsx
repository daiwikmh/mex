const quotes = [
  {
    body: "I have held Bitcoin for nine years and never wanted to sell. Borrowing MUSD against it and letting an agent run my treasury inside a budget is the first thing that made my BTC useful without making it gone.",
    name: "Priya N.",
    role: "Long-term holder",
  },
  {
    body: "The part that sold me is that the agent settles every action on chain. I do not have to trust a dashboard. I can read exactly what it spent and what it did. Metered, not a subscription I forget to cancel.",
    name: "Marcus O.",
    role: "DeFi power user",
  },
  {
    body: "Gas in BTC, a Bitcoin-backed stablecoin, and agent fees that flow back to stakers — the whole loop runs on Mezo without bolting on a foreign token. Stake MEZO and you are paid by real usage, not emissions.",
    name: "Ethan T.",
    role: "Mezo ecosystem builder",
  },
] as const;

export function Testimonials() {
  return (
    <div className="relative h-full w-full" style={{ background: "#0d0d0d", color: "#f4f6e6" }}>
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 sm:py-20">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(207, 224, 168, 0.7)" }}>
              Voices
            </div>
            <h2 className="mt-3 max-w-3xl font-serif text-4xl tracking-tight sm:text-6xl" style={{ color: "#f4f6e6" }}>
              Three people who don&apos;t agree on anything.
              <br />
              <span style={{ color: "rgba(244, 246, 230, 0.5)" }}>They agree on this.</span>
            </h2>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="flex h-full flex-col justify-between gap-8 rounded-2xl p-7"
              style={{ background: "#1a1a1a", border: "1px solid rgba(232, 240, 216, 0.12)" }}
            >
              <blockquote
                className="text-[15px] leading-7"
                style={{ color: "rgba(244, 246, 230, 0.88)" }}
                dangerouslySetInnerHTML={{ __html: `&ldquo;${q.body}&rdquo;` }}
              />
              <figcaption>
                <div className="font-medium" style={{ color: "#cfe0a8" }}>{q.name}</div>
                <div className="mt-1 text-sm" style={{ color: "rgba(244, 246, 230, 0.55)" }}>{q.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-10 font-mono text-xs" style={{ color: "rgba(244, 246, 230, 0.35)" }}>
          Personas are illustrative composites. No real customer quotes &mdash; yet.
        </p>
      </div>
    </div>
  );
}
