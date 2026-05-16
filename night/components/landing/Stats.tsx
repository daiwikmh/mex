import { Counter } from "./Counter";

type Stat = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  foot: string;
};

const stats: Stat[] = [
  {
    label: "Credit-bureau revenue we route around",
    value: 16.4,
    prefix: "$",
    suffix: "B",
    decimals: 1,
    foot: "Equifax + TransUnion + Experian, FY 2024 combined data segment.",
  },
  {
    label: "Undercollateralized DeFi addressable TAM",
    value: 1.2,
    prefix: "$",
    suffix: "T",
    decimals: 1,
    foot: "Consumer + SMB credit gap that on-chain rails cannot price today.",
  },
  {
    label: "Midnight throughput we use per underwriting",
    value: 4,
    suffix: " tx",
    foot: "register, opt-in, score-proof, royalty distribute. Mainnet headroom is comfortable.",
  },
];

export function Stats() {
  return (
    <div className="relative h-full w-full bg-background">
      <div
        className="absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(800px 400px at 80% 0%, rgba(182, 194, 255, 0.10), transparent 60%), radial-gradient(700px 500px at 0% 100%, rgba(110, 124, 255, 0.10), transparent 60%)",
        }}
      />
      <div className="noise" aria-hidden />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 sm:py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
          By the numbers
        </div>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
          A market the bureaus rent.
          <br />
          <span className="text-foreground/60">A rail the bureaus can&apos;t build.</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface p-7 sm:p-9">
              <div className="text-5xl font-semibold tracking-tight sm:text-6xl">
                <Counter
                  to={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  decimals={s.decimals ?? 0}
                />
              </div>
              <div className="mt-4 text-[15px] leading-6 text-foreground/75">
                {s.label}
              </div>
              <div className="mt-3 font-mono text-xs text-foreground/45">
                {s.foot}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
