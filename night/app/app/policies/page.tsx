"use client";

import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import {
  useConnectedSources,
  toggleSource,
  writeConnectedSources,
  type ConnectedSource,
} from "@/lib/kg/storage";
import { useLiveGraph, writeLiveSource, clearLiveSource } from "@/lib/kg/live";
import { requestGoogleToken, clearToken, type GoogleSource } from "@/lib/connectors/google-auth";
import { fetchGmailNodes } from "@/lib/connectors/gmail";
import { fetchCalendarNodes } from "@/lib/connectors/calendar";

const HAS_GOOGLE_CLIENT = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type ConnectorId = ConnectedSource;
type ConnectorStatus = "idle" | "connecting" | "syncing" | "ready" | "error";

const CONNECTOR_META: {
  id: ConnectorId;
  label: string;
  description: string;
  nodeTypes: string[];
  googleSource?: GoogleSource;
}[] = [
  {
    id: "gmail",
    label: "Gmail",
    description: "Reads invoice, receipt, vendor and payment emails. Read-only.",
    nodeTypes: ["Email", "Contact"],
    googleSource: "gmail",
  },
  {
    id: "calendar",
    label: "Google Calendar",
    description: "Reads upcoming meetings, attendees, and times. No write access.",
    nodeTypes: ["Meeting", "Contact"],
    googleSource: "calendar",
  },
  {
    id: "finance",
    label: "Finance",
    description: "Invoice and charge data. Requires Stripe key. Cannot move funds.",
    nodeTypes: ["Invoice", "Charge"],
  },
  {
    id: "drive",
    label: "Google Drive",
    description: "Reads contracts and documents you share. Read-only.",
    nodeTypes: ["Document"],
    googleSource: "drive",
  },
];

export default function SourcesPage() {
  const connected = useConnectedSources();
  const liveGraph = useLiveGraph();
  const [statuses, setStatuses] = useState<Partial<Record<ConnectorId, ConnectorStatus>>>({});
  const [errors, setErrors] = useState<Partial<Record<ConnectorId, string>>>({});

  function nodeCountFor(id: ConnectorId): number {
    return liveGraph.nodes.filter((n) => n.source === id && !n.private).length;
  }

  function setStatus(id: ConnectorId, s: ConnectorStatus) {
    setStatuses((prev) => ({ ...prev, [id]: s }));
  }
  function setError(id: ConnectorId, msg: string) {
    setErrors((prev) => ({ ...prev, [id]: msg }));
  }
  function clearError(id: ConnectorId) {
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function connect(meta: (typeof CONNECTOR_META)[number]) {
    clearError(meta.id);

    if (!meta.googleSource) {
      setStatus(meta.id, "ready");
      const next = new Set(connected);
      next.add(meta.id);
      writeConnectedSources(next);
      return;
    }

    if (!HAS_GOOGLE_CLIENT) {
      setError(
        meta.id,
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID not set — add it to .env.local and restart.",
      );
      return;
    }

    setStatus(meta.id, "connecting");
    let token: string;
    try {
      token = await requestGoogleToken(meta.googleSource);
    } catch (e) {
      setStatus(meta.id, "error");
      setError(meta.id, (e as Error).message);
      return;
    }

    setStatus(meta.id, "syncing");
    try {
      let data: { nodes: typeof liveGraph.nodes; edges: typeof liveGraph.edges };
      if (meta.id === "gmail") {
        data = await fetchGmailNodes(token);
      } else if (meta.id === "calendar") {
        data = await fetchCalendarNodes(token);
      } else {
        data = { nodes: [], edges: [] };
      }

      writeLiveSource(meta.id, data);
      const next = new Set(connected);
      next.add(meta.id);
      writeConnectedSources(next);
      setStatus(meta.id, "ready");
    } catch (e) {
      setStatus(meta.id, "error");
      setError(meta.id, (e as Error).message);
      clearToken(meta.googleSource);
    }
  }

  function disconnect(meta: (typeof CONNECTOR_META)[number]) {
    clearLiveSource(meta.id);
    if (meta.googleSource) clearToken(meta.googleSource);
    const next = new Set(connected);
    next.delete(meta.id);
    writeConnectedSources(next);
    setStatus(meta.id, "idle");
    clearError(meta.id);
  }

  const totalNodes = liveGraph.nodes.filter((n) => !n.private).length;
  const totalEdges = liveGraph.edges.length;

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
          Connecting a source triggers a real OAuth flow and fetches your data
          into the local knowledge graph. The agent only sees node types
          permitted by its registered policy — everything else is filtered at
          the TEE boundary before any query runs.
        </p>
      </header>

      {!HAS_GOOGLE_CLIENT && (
        <div className="mb-6 rounded-xl border border-amber-600/40 bg-amber-600/[0.06] px-4 py-3 font-mono text-xs text-foreground/85">
          <span className="font-medium">Setup required:</span> add{" "}
          <code className="rounded bg-foreground/8 px-1">NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id</code>{" "}
          to <code>.env.local</code> and restart the dev server to enable real OAuth. Finance and Drive can still be toggled as demo data.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Connected"  value={String(connected.size)} />
        <Stat label="Available"  value={String(CONNECTOR_META.length)} />
        <Stat label="Live nodes" value={String(totalNodes)} />
        <Stat label="Live edges" value={String(totalEdges)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONNECTOR_META.map((meta) => {
          const isOn     = connected.has(meta.id);
          const status   = statuses[meta.id] ?? (isOn ? "ready" : "idle");
          const err      = errors[meta.id];
          const count    = nodeCountFor(meta.id);
          const busy     = status === "connecting" || status === "syncing";
          const needsKey = !!meta.googleSource && !HAS_GOOGLE_CLIENT;

          return (
            <div
              key={meta.id}
              className={`rounded-2xl border p-5 transition-colors ${
                isOn
                  ? "border-foreground/30 bg-surface"
                  : "border-foreground/12 bg-surface/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot status={status} />
                    <div className="font-medium text-foreground">{meta.label}</div>
                  </div>
                  <p className="mt-1 text-sm text-foreground/65">{meta.description}</p>
                </div>
                <button
                  onClick={() => isOn ? disconnect(meta) : connect(meta)}
                  disabled={busy || (needsKey && !isOn)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-40 ${
                    isOn
                      ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
                      : "border-foreground/25 bg-surface text-foreground/70 hover:text-foreground hover:border-foreground/50"
                  }`}
                >
                  {busy
                    ? status === "connecting" ? "Auth…" : "Syncing…"
                    : isOn
                    ? "Disconnect"
                    : needsKey
                    ? "No key"
                    : "Connect"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {meta.nodeTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-foreground/15 bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground/60"
                  >
                    {t}
                  </span>
                ))}
                {isOn && count > 0 && (
                  <span className="rounded-md border border-emerald-700/30 bg-emerald-700/[0.06] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-700">
                    {count} nodes
                  </span>
                )}
              </div>

              {err && (
                <div className="mt-3 rounded-lg border border-red-700/30 bg-red-700/[0.05] px-3 py-2 font-mono text-[11px] text-red-700">
                  {err}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {connected.size === 0 && (
        <div className="mt-6 rounded-2xl border border-foreground/12 bg-surface p-5 font-mono text-sm text-foreground/55">
          Connect at least one source to populate the knowledge graph. The agent
          needs data to answer questions.
        </div>
      )}
    </AppShell>
  );
}

function StatusDot({ status }: { status: ConnectorStatus }) {
  const cls = {
    idle:       "bg-foreground/25",
    connecting: "bg-amber-500 animate-pulse",
    syncing:    "bg-amber-500 animate-pulse",
    ready:      "bg-emerald-600",
    error:      "bg-red-600",
  }[status];
  return <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${cls}`} />;
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
