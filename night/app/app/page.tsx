import type { Metadata } from "next";
import Link from "next/link";
import { BalancesGrid } from "@/components/mezo/panels";

export const metadata: Metadata = {
  title: "Overview — Steward Console",
};

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Overview" title="Your Bitcoin balance sheet">
        Live balances read from Mezo. Borrow MUSD against your BTC to fund a
        Steward agent, then settle and stake.
      </PageHeader>

      <BalancesGrid />

      <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Next step</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
          Deposit BTC and mint MUSD to get working capital, then delegate it to a
          Steward.
        </p>
        <div className="mt-5">
          <Link
            href="/app/borrow"
            className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Borrow MUSD
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest text-accent">{kicker}</div>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-7 text-foreground/70">{children}</p>
    </div>
  );
}
