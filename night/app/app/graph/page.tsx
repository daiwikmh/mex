import { AppShell } from "@/components/app/AppShell";
import { KgConsole } from "@/components/app/KgConsole";

export const metadata = {
  title: "Knowledge graph — Omnis",
};

export default function GraphPage() {
  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Knowledge graph
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          The world the agent sees.{" "}
          <span className="text-foreground/55">Bounded by typed scope.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Your data is a typed graph: emails, contacts, invoices, charges,
          meetings, documents. The agent&apos;s scope is a structural capability
          over this graph. Out-of-scope nodes and edges are rejected in the
          TEE before the query ever reaches Midnight. The hash of the scope
          is what your wallet signs.
        </p>
      </header>
      <KgConsole />
    </AppShell>
  );
}
