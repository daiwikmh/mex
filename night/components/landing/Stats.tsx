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
    label: "Bitcoin held as a passive store of value",
    value: 2,
    prefix: "$",
    suffix: "T+",
    decimals: 0,
    foot: "Trillions in BTC sit idle. Steward turns it into working capital without a sale.",
  },
  {
    label: "Of every Mezo transaction's gas paid in BTC",
    value: 100,
    suffix: "%",
    foot: "No separate gas token to acquire and hold. On Mezo, Bitcoin is the fuel.",
  },
  {
    label: "Steps in the loop: borrow, delegate, settle, earn",
    value: 4,
    suffix: " steps",
    foot: "One closed loop where the fees an agent pays become the yield a staker earns.",
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
          Your Bitcoin is doing nothing.
          <br />
          <span style={{ color: "rgba(13, 13, 13, 0.5)" }}>Put it to work without letting it go.</span>
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
