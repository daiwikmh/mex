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
    label: "Consumer AI agents projected by 2027",
    value: 1.3,
    prefix: "",
    suffix: "B",
    decimals: 1,
    foot: "Every one of them gets at least one OAuth scope. Almost none of them are revocable on chain.",
  },
  {
    label: "OAuth token leak incidents in the last 12 months",
    value: 184,
    suffix: "+",
    foot: "Each one is a long-lived scope that nobody can prove was rotated. Midnight authorization receipts make this auditable.",
  },
  {
    label: "Midnight transactions per agent session",
    value: 4,
    suffix: " tx",
    foot: "Register, set policy, log query, revoke. Mainnet throughput is comfortable.",
  },
];

export function Stats() {
  return (
    <div className="relative h-full w-full" style={{ background: "#f7f9ef", color: "#0d0d0d" }}>
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10 sm:py-20">
        <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(13, 13, 13, 0.5)" }}>
          By the numbers
        </div>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl tracking-tight sm:text-6xl" style={{ color: "#0d0d0d" }}>
          Agents are shipping anyway.
          <br />
          <span style={{ color: "rgba(13, 13, 13, 0.5)" }}>Without on-chain scope, you are the audit log.</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl sm:grid-cols-3" style={{ background: "rgba(13, 13, 13, 0.1)" }}>
          {stats.map((s) => (
            <div key={s.label} className="p-7 sm:p-9" style={{ background: "#f7f9ef" }}>
              <div className="font-serif text-5xl tracking-tight sm:text-6xl" style={{ color: "#0f5a37" }}>
                <Counter
                  to={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  decimals={s.decimals ?? 0}
                />
              </div>
              <div className="mt-4 text-[15px] leading-6" style={{ color: "rgba(13, 13, 13, 0.78)" }}>
                {s.label}
              </div>
              <div className="mt-3 font-mono text-xs" style={{ color: "rgba(13, 13, 13, 0.5)" }}>
                {s.foot}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
