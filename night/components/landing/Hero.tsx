import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/mezo/WalletButton";

export function Hero() {
  return (
    <div className="relative h-full w-full bg-background">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="absolute inset-0 radial-fade" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 sm:px-10">
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-foreground" />
            <span className="font-serif text-xl text-foreground">Mex</span>
          </div>
          <nav className="hidden gap-8 text-sm text-foreground/80 sm:flex">
            <a href="#features" className="hover:text-foreground">How it works</a>
            <a href="/docs" className="hover:text-foreground">Docs</a>
            <a href="/app" className="hover:text-foreground">Console</a>
          </nav>
          <WalletButton />
        </header>

        <div className="grid flex-1 grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl">
              Bank your
              <br />
              Bitcoin.
              <br />
              Keep control.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-foreground/75">
              Borrow MUSD against your BTC, hand a scoped, revocable budget to an
              agent that settles every action on chain, and route the fees to a
              shared pool. Built on Mezo, where gas is Bitcoin.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/app" size="lg">
                Get started
              </Button>
              <Button href="/docs" size="lg" variant="ghost">
                Read the docs &rarr;
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-3 border-t border-foreground/15 pb-10 pt-6 text-sm text-foreground/70 sm:grid-cols-4">
          <Pillar tag="Borrow" text="Mint MUSD against BTC" />
          <Pillar tag="Delegate" text="Fund a scoped budget" />
          <Pillar tag="Settle" text="Pay per action, on chain" />
          <Pillar tag="Earn" text="Fees flow to the pool" />
        </div>
      </div>
    </div>
  );
}

function Pillar({ tag, text }: { tag: string; text: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
        {tag}
      </div>
      <div className="mt-1 text-foreground/85">{text}</div>
    </div>
  );
}
