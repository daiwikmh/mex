import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/mezo/WalletButton";

export const metadata: Metadata = {
  title: "Mezo Docs — Get started with Bitcoin banking",
  description:
    "Deposit, borrow and put your Bitcoin to work on Mezo. Fund AI agents with MUSD, settle in MEZO, and earn yield by staking.",
};

type Doc = { title: string; body: string; href: string; badge: string };

const getStarted: Doc[] = [
  {
    badge: "01",
    title: "Open the console",
    body: "Launch the Mex console and connect a wallet to Mezo.",
    href: "/app",
  },
  {
    badge: "02",
    title: "Connect your wallet",
    body: "Connect an EVM wallet to Mezo and read your BTC and MUSD balances.",
    href: "/app",
  },
  {
    badge: "03",
    title: "Borrow MUSD",
    body: "Deposit BTC and mint MUSD against it to fund a Mex.",
    href: "/app/borrow",
  },
  {
    badge: "04",
    title: "Delegate a Mex",
    body: "Fund a scoped agent with a budget and a per-action ceiling.",
    href: "/app/delegate",
  },
];

const learn: Doc[] = [
  {
    badge: "A",
    title: "Why Bitcoin needs banking",
    body: "The fundamental reasons behind the Mezo network.",
    href: "#",
  },
  {
    badge: "B",
    title: "Self-service banking",
    body: "A deep dive into Mezo's free-banking economy for Bitcoiners.",
    href: "#",
  },
  {
    badge: "C",
    title: "What is MUSD?",
    body: "Mezo's native Bitcoin-backed stablecoin, explained.",
    href: "#",
  },
];

const loans: Doc[] = [
  {
    badge: "₿",
    title: "Borrow and mint MUSD",
    body: "Use your assets to unlock the spending power of your Bitcoin.",
    href: "#",
  },
];

const integrations: Doc[] = [
  {
    badge: "L",
    title: "Lolli",
    body: "Connect with partner platforms to enhance your Bitcoin experience.",
    href: "#",
  },
  {
    badge: "S",
    title: "Safe",
    body: "Use Safe multisig wallets on Mezo to manage shared funds securely.",
    href: "#",
  },
  {
    badge: "C",
    title: "Community projects",
    body: "Mezo Tools, Matchbox, Vezo and other community-built integrations.",
    href: "#",
  },
  {
    badge: "★",
    title: "Mex agents",
    body: "Delegate an AI agent that banks your Bitcoin, settles in MEZO, and reports every action.",
    href: "#steward",
  },
];

const developers: Doc[] = [
  {
    badge: "</>",
    title: "Developer documentation",
    body: "Build on Mezo. Contracts, RPC, SDKs and the agent runtime.",
    href: "#",
  },
  {
    badge: "$",
    title: "Agent payments",
    body: "Metered MEZO settlement per agent action: dynamic fees, access tokens, automated treasury.",
    href: "#",
  },
  {
    badge: "%",
    title: "Mezo Earn — staking & rewards",
    body: "Stake MEZO to earn yield from real agent fee flow and unlock loyalty fee discounts.",
    href: "#",
  },
];

const flywheel = [
  {
    step: "01",
    title: "Borrow MUSD",
    body: "Deposit BTC, mint MUSD against it. Mezo's core banking primitive funds the agent.",
  },
  {
    step: "02",
    title: "Fund a Mex",
    body: "Allocate MUSD to a scoped AI agent that acts on your behalf inside its budget.",
  },
  {
    step: "03",
    title: "Pay per action in MEZO",
    body: "Every agent action settles in MEZO with dynamic fees. Metered, not a flat subscription.",
  },
  {
    step: "04",
    title: "Stakers earn the fees",
    body: "Agent fees stream to MEZO stakers. Stake to earn yield and unlock loyalty fee discounts.",
  },
];

export default function DocsPage() {
  return (
    <main className="relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden />
      <div className="pointer-events-none absolute inset-0 radial-fade" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-10">
        <header className="flex items-center justify-between pt-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-foreground" />
            <span className="font-serif text-xl text-foreground">Mezo</span>
          </Link>
          <nav className="hidden gap-8 text-sm text-foreground/80 sm:flex">
            <a href="#get-started" className="hover:text-foreground">Get started</a>
            <a href="#learn" className="hover:text-foreground">Learn</a>
            <a href="#steward" className="hover:text-foreground">Mex</a>
            <Link href="/app" className="hover:text-foreground">Console</Link>
          </nav>
          <WalletButton />
        </header>

        <section className="border-b border-foreground/10 pb-14 pt-16 sm:pt-24">
          <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
            Documentation
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl">
            Put your Bitcoin
            <br />
            to work.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-foreground/75">
            Learn the basics of depositing and borrowing on Mezo, then go
            further: fund AI agents with MUSD, settle their actions in MEZO, and
            earn yield by staking the fees they pay.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="#get-started" size="lg">
              Get started
            </Button>
            <Button href="#steward" size="lg" variant="ghost">
              Meet Mex &rarr;
            </Button>
          </div>
        </section>
      </div>

      <Featured />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-28 sm:px-10">
        <DocSection
          id="get-started"
          kicker="Get started"
          title="Open your Bitcoin account"
          description="The basics of depositing and borrowing assets, or connect straight to Mezo Mainnet."
          docs={getStarted}
        />
        <DocSection
          id="learn"
          kicker="Learn"
          title="How Bitcoin banking works"
          description="The Mezo network, MUSD, and how they unlock access to Bitcoin equity."
          docs={learn}
        />
        <DocSection
          id="loans"
          kicker="Bitcoin loans"
          title="Spend without selling"
          description="Use your assets to unlock the spending power of your Bitcoin."
          docs={loans}
        />
        <DocSection
          id="integrations"
          kicker="Integrations"
          title="Connect partner platforms"
          description="Extend your Bitcoin experience with platforms built on and around Mezo."
          docs={integrations}
        />
        <DocSection
          id="developers"
          kicker="Developers"
          title="Build the agent economy"
          description="Staking, metered agent payments, and the infrastructure that ties them together."
          docs={developers}
        />
      </div>
    </main>
  );
}

function Featured() {
  return (
    <section id="steward" className="relative" style={{ background: "#0f5a37", color: "#e8f0d8" }}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "rgba(230, 238, 91, 0.55)" }}>
          Featured · Staking + agent payments
        </div>
        <h2 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight sm:text-6xl" style={{ color: "#e8f0d8" }}>
          Mex
          <br />
          <span style={{ color: "rgba(230, 238, 91, 0.55)" }}>AI agents that bank your Bitcoin.</span>
        </h2>
        <p className="mt-6 max-w-xl text-[15px] leading-7" style={{ color: "rgba(244, 246, 230, 0.8)" }}>
          One loop closes on itself: the MEZO an agent spends becomes the yield a
          staker earns, which becomes the discount that makes the next action
          cheaper. Payments fund staking; staking discounts payments.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4" style={{ background: "rgba(232, 240, 216, 0.18)" }}>
          {flywheel.map((f) => (
            <article key={f.step} className="flex flex-col gap-4 p-7 sm:p-8" style={{ background: "#0a3a25" }}>
              <div className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "#9ec591" }}>
                {f.step}
              </div>
              <h3 className="font-serif text-2xl tracking-tight" style={{ color: "#f4f6e6" }}>
                {f.title}
              </h3>
              <p className="text-[15px] leading-7" style={{ color: "rgba(244, 246, 230, 0.8)" }}>
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DocSection({
  id,
  kicker,
  title,
  description,
  docs,
}: {
  id: string;
  kicker: string;
  title: string;
  description: string;
  docs: Doc[];
}) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-foreground/10 py-16">
      <div className="mb-10 max-w-2xl">
        <div className="font-mono text-xs uppercase tracking-widest text-accent">
          {kicker}
        </div>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/70">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => (
          <DocCard key={d.title} doc={d} />
        ))}
      </div>
    </section>
  );
}

function DocCard({ doc }: { doc: Doc }) {
  return (
    <a
      href={doc.href}
      className="group flex flex-col justify-between gap-8 rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-surface-2"
    >
      <div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-accent">
          {doc.badge}
        </span>
        <h3 className="mt-5 font-serif text-xl tracking-tight text-foreground">
          {doc.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">{doc.body}</p>
      </div>
      <span className="font-mono text-xs text-foreground/50 transition-colors group-hover:text-accent">
        Read &rarr;
      </span>
    </a>
  );
}
