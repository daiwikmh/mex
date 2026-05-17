"use client";

import { useEffect, useState } from "react";
import { GraphView } from "./GraphView";
import { readGraph, type FinancialGraph, type GraphEdge, type GraphNode } from "@/lib/graph";

export function GraphTab() {
  const [graph, setGraph] = useState<FinancialGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  useEffect(() => {
    setGraph(readGraph());
    const onChange = () => setGraph(readGraph());
    window.addEventListener("nocturne:graph-change", onChange);
    return () => window.removeEventListener("nocturne:graph-change", onChange);
  }, []);

  if (!graph) {
    return (
      <div className="rounded-2xl border border-foreground/15 bg-surface p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Knowledge graph
        </div>
        <p className="mt-3 text-foreground/70">
          Upload a bank CSV on the Borrow tab. The agent will extract typed
          financial entities and relationships, persisted privately in your
          vault.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
              Your financial graph
            </div>
            <div className="text-2xl font-medium text-foreground">
              {graph.nodes.length} entities · {graph.edges.length} relationships
            </div>
          </div>
          <div className="font-mono text-xs text-foreground/55">
            from {graph.source.fileName} · {graph.source.rowCount} rows
          </div>
        </div>

        <GraphView
          graph={graph}
          onNodeClick={(n) => {
            setSelectedNode(n);
            setSelectedEdge(null);
          }}
          onEdgeClick={(e) => {
            setSelectedEdge(e);
            setSelectedNode(null);
          }}
        />

        <Legend />
      </div>

      <ContextPanel
        graph={graph}
        node={selectedNode}
        edge={selectedEdge}
      />
    </div>
  );
}

function Legend() {
  const items: Array<{ label: string; color: string }> = [
    { label: "account",         color: "#1a1607" },
    { label: "income",          color: "#5fb364" },
    { label: "debt",            color: "#e07b5b" },
    { label: "recurring",       color: "#9bd5e0" },
    { label: "merchant",        color: "#cdd9ff" },
    { label: "transaction",     color: "#efe7a4" },
  ];
  return (
    <div className="flex flex-wrap gap-3 font-mono text-[11px] text-foreground/65">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-foreground/30"
            style={{ background: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function ContextPanel({
  graph,
  node,
  edge,
}: {
  graph: FinancialGraph;
  node: GraphNode | null;
  edge: GraphEdge | null;
}) {
  if (edge) return <EdgeDetail graph={graph} edge={edge} />;
  if (node) return <NodeDetail graph={graph} node={node} />;
  return (
    <div className="rounded-2xl border border-foreground/15 bg-surface p-6">
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
        Inspect
      </div>
      <p className="mt-3 text-sm text-foreground/70">
        Click any entity or relationship in the graph to see its raw
        evidence, attributes, and which other entities reference it.
      </p>
      <div className="mt-6 space-y-2 text-sm text-foreground/65">
        <div>
          Underwriting reads this graph deterministically &mdash; income streams,
          debt obligations, recurring charges. The score is a function over
          these nodes, not a black-box LLM call.
        </div>
        <div className="font-mono text-xs text-foreground/45">
          The ZK proof sent to the lender attests over graph properties, not over
          the raw transactions.
        </div>
      </div>
    </div>
  );
}

function NodeDetail({ graph, node }: { graph: FinancialGraph; node: GraphNode }) {
  const incoming = graph.edges.filter((e) => e.dst === node.id);
  const outgoing = graph.edges.filter((e) => e.src === node.id);

  return (
    <div className="rounded-2xl border border-foreground/15 bg-surface p-6">
      <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/50">
        {node.type.replace(/_/g, " ")}
      </div>
      <div className="mt-1 text-xl font-medium text-foreground">{node.label}</div>
      <div className="mt-1 font-mono text-[10px] text-foreground/45 break-all">{node.id}</div>

      <div className="mt-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
          Attributes
        </div>
        <dl className="mt-2 grid grid-cols-1 gap-1.5 font-mono text-[11px]">
          {Object.entries(node.attrs).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-foreground/8 py-1">
              <dt className="text-foreground/55">{k}</dt>
              <dd className="text-foreground truncate">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Relationships graph={graph} incoming={incoming} outgoing={outgoing} self={node.id} />
    </div>
  );
}

function Relationships({
  graph,
  incoming,
  outgoing,
  self,
}: {
  graph: FinancialGraph;
  incoming: GraphEdge[];
  outgoing: GraphEdge[];
  self: string;
}) {
  const total = incoming.length + outgoing.length;
  if (total === 0) {
    return (
      <div className="mt-5 font-mono text-[11px] text-foreground/45">
        no relationships yet
      </div>
    );
  }

  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="mt-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
        Connected via ({total})
      </div>
      <ul className="mt-2 space-y-1.5">
        {outgoing.slice(0, 6).map((e) => (
          <li key={e.id} className="text-sm">
            <span className="text-foreground/55">this</span>{" "}
            <span className="font-medium text-foreground">
              {e.type.replace(/_/g, " ")}
            </span>{" "}
            <span className="text-foreground/80">{label(e.dst)}</span>
            {e.amount != null && (
              <span className="ml-2 font-mono text-[10px] text-foreground/50">
                {money(e.amount)}
              </span>
            )}
          </li>
        ))}
        {incoming.slice(0, 6).map((e) => (
          <li key={e.id} className="text-sm">
            <span className="text-foreground/80">{label(e.src)}</span>{" "}
            <span className="font-medium text-foreground">
              {e.type.replace(/_/g, " ")}
            </span>{" "}
            <span className="text-foreground/55">this</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EdgeDetail({ graph, edge }: { graph: FinancialGraph; edge: GraphEdge }) {
  const src = graph.nodes.find((n) => n.id === edge.src);
  const dst = graph.nodes.find((n) => n.id === edge.dst);

  return (
    <div className="rounded-2xl border border-foreground/15 bg-surface p-6">
      <div className="font-mono text-[11px] uppercase tracking-widest text-foreground/50">
        relationship
      </div>
      <div className="mt-3 rounded-xl border border-foreground/10 bg-surface-2 px-3 py-3">
        <div className="text-sm text-foreground">{src?.label ?? edge.src}</div>
        <div className="my-1 font-mono text-[11px] uppercase tracking-widest text-foreground/65">
          ↓ {edge.type.replace(/_/g, " ")}
        </div>
        <div className="text-sm text-foreground">{dst?.label ?? edge.dst}</div>
      </div>

      <div className="mt-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
          Evidence
        </div>
        <div className="mt-1 border-l-2 border-foreground/30 pl-3 font-mono text-xs text-foreground/80">
          {edge.evidence}
        </div>
      </div>

      {edge.amount != null && (
        <div className="mt-4 font-mono text-[11px] text-foreground/55">
          amount: <span className="text-foreground">{money(edge.amount)}</span>
        </div>
      )}
      {edge.observed_at && (
        <div className="mt-1 font-mono text-[11px] text-foreground/55">
          observed: <span className="text-foreground">{edge.observed_at}</span>
        </div>
      )}
    </div>
  );
}

function money(n: number): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}
