"use client";

import { AppShell } from "@/components/app/AppShell";
import { useConnectedSources, toggleSource, type ConnectedSource } from "@/lib/kg/storage";
import { SEED_GRAPH } from "@/lib/kg/seed";

const CONNECTORS: {
  id: ConnectedSource;
  label: string;
  description: string;
  nodeTypes: string[];
}[] = [
  {
    id: "gmail",
    label: "Gmail",
    description: "Reads invoice, receipt, and vendor emails. Never sends on your behalf.",
    nodeTypes: ["Email"],
  },
  {
    id: "calendar",
    label: "Google Calendar",
    description: "Reads meeting titles, attendees, and times. No write access.",
    nodeTypes: ["Meeting"],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Reads invoices and charges from Stripe. Cannot move funds.",
    nodeTypes: ["Invoice", "Charge"],
  },
  {
    id: "drive",
    label: "Google Drive",
    description: "Reads contracts and documents you explicitly share. Read-only.",
    nodeTypes: ["Document"],
  },
];

export default function SourcesPage() {
  const connected = useConnectedSources();

  function nodeCountForSource(id: ConnectedSource): number {
    return SEED_GRAPH.nodes.filter((n) => n.source === id && !n.private).length;
  }

  const totalConnected = connected.size;
  const totalNodes = SEED_GRAPH.nodes.filter(
    (n) => !n.private && (!n.source || connected.has(n.source)),
  ).length;

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Data sources
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Your data, scoped.{" "}
          <span className="text-foreground/55">Nothing flows without a policy.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Connect a source to add its data to the knowledge graph. The agent only
          sees node types covered by its registered policy — everything else is
          filtered at the TEE boundary before any query runs.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Connected"  value={String(totalConnected)} />
        <Stat label="Available"  value={String(CONNECTORS.length)} />
        <Stat label="KG nodes"   value={String(totalNodes)} />
        <Stat label="KG edges"   value={String(SEED_GRAPH.edges.length)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONNECTORS.map((c) => {
          const isOn = connected.has(c.id);
          const count = nodeCountForSource(c.id);
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-5 transition-colors ${
                isOn
                  ? "border-foreground/30 bg-surface"
                  : "border-foreground/12 bg-surface/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        isOn ? "bg-emerald-600" : "bg-foreground/25"
                      }`}
                    />
                    <div className="font-medium text-foreground">{c.label}</div>
                  </div>
                  <p className="mt-1 text-sm text-foreground/65">{c.description}</p>
                </div>
                <button
                  onClick={() => toggleSource(c.id)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                    isOn
                      ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
                      : "border-foreground/25 bg-surface text-foreground/70 hover:text-foreground hover:border-foreground/50"
                  }`}
                >
                  {isOn ? "Disconnect" : "Connect"}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.nodeTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-foreground/15 bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground/60"
                  >
                    {t}
                  </span>
                ))}
                {isOn && (
                  <span className="rounded-md border border-emerald-700/30 bg-emerald-700/[0.06] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-700">
                    {count} nodes
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalConnected === 0 && (
        <div className="mt-6 rounded-2xl border border-foreground/12 bg-surface p-5 font-mono text-sm text-foreground/55">
          Connect at least one source to populate the knowledge graph. The agent
          needs data to answer questions.
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-foreground/15 bg-surface px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/55">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl text-foreground">{value}</div>
    </div>
  );
}
