import { AppShell } from "@/components/app/AppShell";
import { GraphTab } from "@/components/app/GraphTab";

export const metadata = {
  title: "Knowledge graph — Nocturne",
};

export default function GraphPage() {
  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Knowledge graph
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Your financial graph.{" "}
          <span className="text-foreground/55">Compounds with every upload.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Typed entities and relationships extracted from your bank statements.
          The underwriting agent reads from this graph. The ZK proof attests over
          its properties. None of the raw transactions ever leave your browser.
        </p>
      </header>
      <GraphTab />
    </AppShell>
  );
}
