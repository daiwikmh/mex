import { Button } from "@/components/ui/Button";

export function CTAFooter() {
  return (
    <div className="relative h-full w-full bg-background">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
      <div
        className="absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background:
            "radial-gradient(900px 500px at 50% 50%, rgba(110, 124, 255, 0.20), transparent 60%)",
        }}
      />
      <div className="noise" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-6 py-16 sm:px-10 sm:py-20">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-foreground/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Testnet live · Mainnet on schedule
          </div>
          <h2 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.025em] sm:text-7xl">
            Stop renting your credit identity.
            <br />
            <span className="text-foreground/60">Start earning from it.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-7 text-foreground/65">
            Open the vault. Underwrite once. Get paid every time the cohort is
            used. The bureaus have a forty-year head start. They don&apos;t have
            this.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/app/vault" size="lg">
              Launch app
              <span aria-hidden>→</span>
            </Button>
            <Button href="#" size="lg" variant="secondary">
              Read the whitepaper
            </Button>
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 text-sm text-foreground/55 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-strong" />
            <span className="font-mono">nocturne · private credit co-op</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground">
              GitHub
            </a>
            <a href="#" className="hover:text-foreground">
              X
            </a>
            <a href="#" className="hover:text-foreground">
              Discord
            </a>
          </div>
          <div className="font-mono text-xs text-foreground/35">
            v0.1.0 · testnet
          </div>
        </footer>
      </div>
    </div>
  );
}
