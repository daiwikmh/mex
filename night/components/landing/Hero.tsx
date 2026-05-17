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
            <span className="font-serif text-xl text-foreground">Nocturne</span>
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

          <IconCluster />
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

const ICONS = [
  { bg: "#0d0d0d", fg: "#e8f0d8", label: "N",  x: 4,  y: 28, size: 76, ring: false },
  { bg: "#0f5a37", fg: "#e8f0d8", label: "M",  x: 28, y: 4,  size: 72, ring: false },
  { bg: "#f4f6e6", fg: "#0d0d0d", label: "P",  x: 56, y: 14, size: 68, ring: true  },
  { bg: "#0f5a37", fg: "#e8f0d8", label: "S",  x: 14, y: 50, size: 60, ring: false },
  { bg: "#0d0d0d", fg: "#e8f0d8", label: "→",  x: 64, y: 44, size: 62, ring: false },
  { bg: "#cfe0a8", fg: "#0d0d0d", label: "T",  x: 8,  y: 70, size: 58, ring: false },
  { bg: "#c97a4a", fg: "#0d0d0d", label: "R",  x: 40, y: 64, size: 64, ring: false },
  { bg: "#f4f6e6", fg: "#0f5a37", label: "A",  x: 70, y: 76, size: 58, ring: false },
  { bg: "#0d0d0d", fg: "#e8f0d8", label: "Z",  x: 78, y: 30, size: 50, ring: false },
];

function IconCluster() {
  return (
    <div className="relative hidden h-[480px] w-full lg:block">
      {ICONS.map((ic, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center rounded-full font-serif shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)]"
          style={{
            background: ic.bg,
            color: ic.fg,
            left: `${ic.x}%`,
            top: `${ic.y}%`,
            width: ic.size,
            height: ic.size,
            fontSize: ic.size * 0.42,
            border: ic.ring ? "3px solid #fff" : "none",
          }}
        >
          {ic.label}
        </div>
      ))}
    </div>
  );
}
