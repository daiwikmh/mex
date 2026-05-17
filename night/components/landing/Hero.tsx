import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <div className="relative h-full w-full bg-background">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="absolute inset-0 radial-fade" aria-hidden />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-6 sm:px-10">
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-foreground" />
            <span className="font-serif text-xl text-foreground">Omnis</span>
          </div>
          <nav className="hidden gap-8 text-sm text-foreground/80 sm:flex">
            <a href="#features" className="hover:text-foreground">How it works</a>
            <a href="#stats" className="hover:text-foreground">Why Midnight</a>
            <a href="#testimonials" className="hover:text-foreground">FAQ</a>
          </nav>
          <Button href="/app/agents" size="sm" variant="secondary">
            Launch console
          </Button>
        </header>

        <div className="grid flex-1 grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl">
              Delegate the
              <br />
              agent. Never
              <br />
              the keys.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-foreground/75">
              A revocable, scoped AI agent that acts on your behalf inside a TEE.
              Every query logged on Midnight. Kill its access in one transaction
              and the chain enforces it.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/app/agents" size="lg">
                Open the console
              </Button>
              <Button href="/app/demo" size="lg" variant="ghost">
                Watch the demo &rarr;
              </Button>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-3 border-t border-foreground/15 pb-10 pt-6 text-sm text-foreground/70 sm:grid-cols-4">
          <Pillar tag="Scope" text="Policy you sign on chain" />
          <Pillar tag="TEE"   text="Agent runs sealed" />
          <Pillar tag="Audit" text="Every query receipt logged" />
          <Pillar tag="Revoke" text="One tx kills access" />
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

