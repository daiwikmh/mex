const quotes = [
  {
    body: "We had to choose: stop offering uncollateralized lines or get sued for storing every borrower&apos;s statement. Nocturne is the only thing I&apos;ve seen that lets us underwrite without warehousing.",
    name: "Priya N.",
    role: "Risk lead, undercollateralized DeFi protocol",
  },
  {
    body: "I&apos;m not handing PDF statements to a startup. The TEE attestation plus the ZK score is the first version of this I&apos;d actually opt into.",
    name: "Marcus O.",
    role: "Privacy-first borrower, applied for an MX 90-day line",
  },
  {
    body: "Shielded cohort membership plus private royalties is exactly the kind of mechanic Compact circuits were designed for. This is the showcase app.",
    name: "Ethan T.",
    role: "Midnight ecosystem advocate",
  },
] as const;

export function Testimonials() {
  return (
    <div className="relative h-full w-full bg-surface-2">
      <div className="noise" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 sm:py-20">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              Voices
            </div>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Three people who don&apos;t agree on anything.
              <br />
              <span className="text-foreground/60">They agree on this.</span>
            </h2>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="flex h-full flex-col justify-between gap-8 rounded-2xl border border-border bg-surface p-7"
            >
              <blockquote
                className="text-[15px] leading-7 text-foreground/85"
                dangerouslySetInnerHTML={{ __html: `&ldquo;${q.body}&rdquo;` }}
              />
              <figcaption>
                <div className="font-medium">{q.name}</div>
                <div className="mt-1 text-sm text-foreground/55">{q.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-10 font-mono text-xs text-foreground/40">
          Personas are illustrative composites. No real customer quotes — yet.
        </p>
      </div>
    </div>
  );
}
