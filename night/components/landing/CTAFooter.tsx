import { Button } from "@/components/ui/Button";

export function CTAFooter() {
  return (
    <div className="relative h-full w-full" style={{ background: "#e8f0d8", color: "#0d0d0d" }}>
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-6 py-16 sm:px-10 sm:py-20">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs" style={{ background: "rgba(13, 13, 13, 0.06)", border: "1px solid rgba(13, 13, 13, 0.18)", color: "rgba(13, 13, 13, 0.78)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#0f5a37" }} />
            Mezo Testnet live · gas paid in BTC
          </div>
          <h2 className="mt-6 max-w-4xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl" style={{ color: "#0d0d0d" }}>
            Keep your Bitcoin. Spend its power.
            <br />
            <span style={{ color: "rgba(13, 13, 13, 0.5)" }}>Borrow it. Delegate it. Earn on it.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-7" style={{ color: "rgba(13, 13, 13, 0.72)" }}>
            Borrow MUSD against your BTC, fund an agent that settles on chain, and
            earn from the fees it pays. Connect a wallet to Mezo and start the loop.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/docs" size="lg">
              Open the docs
              <span aria-hidden>→</span>
            </Button>
            <Button href="/docs" size="lg" variant="ghost">
              Meet Mex
            </Button>
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-6 pt-8 text-sm sm:flex-row" style={{ borderTop: "1px solid rgba(13, 13, 13, 0.18)", color: "rgba(13, 13, 13, 0.65)" }}>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#0f5a37" }} />
            <span className="font-mono">Mex · bank your Bitcoin on Mezo</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:underline">GitHub</a>
            <a href="#" className="hover:underline">X</a>
            <a href="#" className="hover:underline">Discord</a>
          </div>
          <div className="font-mono text-xs" style={{ color: "rgba(13, 13, 13, 0.45)" }}>
            v0.1.0 · testnet
          </div>
        </footer>
      </div>
    </div>
  );
}
