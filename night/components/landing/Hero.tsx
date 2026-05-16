import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <div className="relative h-full w-full bg-background">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="absolute inset-0 radial-fade" aria-hidden />
      <div className="noise" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-6 pt-10 pb-16 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent-strong shadow-[0_0_18px_2px_var(--accent-strong)]" />
            <span className="font-mono text-sm tracking-tight text-foreground/80">
              nocturne
            </span>
          </div>
          <nav className="hidden gap-8 text-sm text-foreground/70 sm:flex">
            <a href="#features" className="hover:text-foreground">
              Pillars
            </a>
            <a href="#stats" className="hover:text-foreground">
              Numbers
            </a>
            <a href="#testimonials" className="hover:text-foreground">
              Voices
            </a>
            <a href="/app/vault" className="hover:text-foreground">
              App
            </a>
          </nav>
          <Button href="/app/vault" size="sm" variant="secondary">
            Launch
          </Button>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-foreground/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Built on Midnight · TEE underwriting · ZK credit proofs
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.025em] sm:text-7xl">
            Your bank history is an asset.
            <br />
            <span className="text-foreground/60">
              Lend it without showing it.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 text-foreground/65">
            A private credit data co-op. An LLM inside a TEE underwrites loans
            against a shielded cohort. Lenders verify a ZK proof of score.
            Nobody — not the lender, not us — ever sees a single transaction.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/app/vault" size="lg">
              Open the vault
              <span aria-hidden>→</span>
            </Button>
            <Button href="/app/lend" size="lg" variant="secondary">
              Try the lender demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-3 border-t border-border pt-6 text-sm text-foreground/55 sm:grid-cols-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              AI
            </div>
            <div className="mt-1">LLM-in-TEE underwriting</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              Data
            </div>
            <div className="mt-1">Yield-bearing private vaults</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              DeFi
            </div>
            <div className="mt-1">Undercollateralized USDC</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
              Midnight
            </div>
            <div className="mt-1">Shielded cohort + score proof</div>
          </div>
        </div>
      </div>
    </div>
  );
}
