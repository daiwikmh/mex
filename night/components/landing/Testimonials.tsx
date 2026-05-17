const quotes = [
  {
    body: "I want an agent that handles invoices and travel. I do not want to mint a permanent OAuth token to a startup that will be acquired in eighteen months. A revocable scope I can read on chain is the only version of this I would deploy.",
    name: "Priya N.",
    role: "Operations lead, mid-stage fintech",
  },
  {
    body: "Every assistant I have used kept context I never authorized. With Omnis the policy is a transaction. If it reads something out of scope, the chain rejects the receipt. That is what I have been asking for.",
    name: "Marcus O.",
    role: "Privacy-conscious power user",
  },
  {
    body: "Scoped agent authorization, attested TEE execution, on-chain query receipts and instant revocation — this is exactly the shape Compact circuits were designed for. Showcase app material.",
    name: "Ethan T.",
    role: "Midnight ecosystem advocate",
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
