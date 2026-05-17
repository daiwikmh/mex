"use client";

import { useMemo, useState } from "react";
import type { EntityKind, FinancialGraph, GraphEdge, GraphNode } from "@/lib/graph";

interface Props {
  graph: FinancialGraph;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  height?: number;
}

const TYPE_ORDER: EntityKind[] = [
  "account",
  "income_stream",
  "debt_obligation",
  "recurring_charge",
  "merchant",
  "transaction",
];

const TYPE_COLORS: Record<EntityKind, { bg: string; ring: string; fg: string }> = {
  account:          { bg: "#1a1607", ring: "#1a1607", fg: "#e6ee5b" },
  income_stream:    { bg: "#5fb364", ring: "#3d8742", fg: "#ffffff" },
  debt_obligation:  { bg: "#e07b5b", ring: "#b85a3d", fg: "#ffffff" },
  recurring_charge: { bg: "#9bd5e0", ring: "#5fa8b6", fg: "#1a1607" },
  merchant:         { bg: "#cdd9ff", ring: "#7c8cd4", fg: "#1a1607" },
  transaction:      { bg: "#efe7a4", ring: "#a9a07a", fg: "#1a1607" },
};

const COLUMN_LABELS: Record<EntityKind, string> = {
  account: "Accounts",
  income_stream: "Income streams",
  debt_obligation: "Debt obligations",
  recurring_charge: "Recurring charges",
  merchant: "Merchants",
  transaction: "Transactions",
};

const COL_WIDTH = 200;
const NODE_W = 168;
const NODE_H = 38;
const NODE_GAP = 8;
const COL_HEADER = 32;

export function GraphView({ graph, onNodeClick, onEdgeClick, height = 560 }: Props) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  const layout = useMemo(() => computeLayout(graph), [graph]);

  const visibleCols = TYPE_ORDER.filter((t) => (layout.byType.get(t)?.length ?? 0) > 0);
  const width = visibleCols.length * COL_WIDTH + 60;

  return (
    <div className="relative w-full overflow-auto rounded-2xl border border-foreground/15 bg-surface" style={{ height }}>
      <svg width={width} height={Math.max(height, layout.maxColHeight + COL_HEADER + 60)} className="block">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a1607" opacity="0.5" />
          </marker>
        </defs>

        {visibleCols.map((kind, colIdx) => (
          <text
            key={`hdr-${kind}`}
            x={colIdx * COL_WIDTH + 30 + NODE_W / 2}
            y={20}
            textAnchor="middle"
            className="font-mono"
            fontSize="10"
            fill="#1a1607"
            opacity="0.55"
            style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            {COLUMN_LABELS[kind]} ({layout.byType.get(kind)?.length ?? 0})
          </text>
        ))}

        {layout.edges.map((e) => {
          const isHover = hoverEdge === e.edge.id;
          const isNodeHover = hoverNode && (e.edge.src === hoverNode || e.edge.dst === hoverNode);
          const active = isHover || isNodeHover;
          return (
            <g key={e.edge.id}>
              <path
                d={curve(e.x1, e.y1, e.x2, e.y2)}
                fill="none"
                stroke="#1a1607"
                strokeWidth={active ? 1.6 : 0.8}
                opacity={active ? 0.65 : 0.18}
                markerEnd="url(#arrow)"
                onMouseEnter={() => setHoverEdge(e.edge.id)}
                onMouseLeave={() => setHoverEdge(null)}
                onClick={() => onEdgeClick?.(e.edge)}
                style={{ cursor: onEdgeClick ? "pointer" : "default" }}
              />
            </g>
          );
        })}

        {layout.nodes.map((p) => {
          const col = TYPE_COLORS[p.node.type];
          const isHover = hoverNode === p.node.id;
          return (
            <g
              key={p.node.id}
              transform={`translate(${p.x}, ${p.y})`}
              onMouseEnter={() => setHoverNode(p.node.id)}
              onMouseLeave={() => setHoverNode(null)}
              onClick={() => onNodeClick?.(p.node)}
              style={{ cursor: onNodeClick ? "pointer" : "default" }}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill={col.bg}
                stroke={col.ring}
                strokeWidth={isHover ? 2.5 : 1.2}
                opacity={isHover ? 1 : 0.96}
              />
              <text
                x={12}
                y={NODE_H / 2 + 4}
                fontSize="12"
                fill={col.fg}
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {truncate(p.node.label, 22)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface NodeLayout {
  node: GraphNode;
  x: number;
  y: number;
}

interface EdgeLayout {
  edge: GraphEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function computeLayout(graph: FinancialGraph): {
  byType: Map<EntityKind, GraphNode[]>;
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  maxColHeight: number;
} {
  const byType = new Map<EntityKind, GraphNode[]>();
  for (const k of TYPE_ORDER) byType.set(k, []);
  for (const n of graph.nodes) {
    const arr = byType.get(n.type);
    if (arr) arr.push(n);
  }

  for (const arr of byType.values()) {
    arr.sort((a, b) => a.label.localeCompare(b.label));
  }

  const visibleCols = TYPE_ORDER.filter((t) => (byType.get(t)?.length ?? 0) > 0);
  const pos = new Map<string, { x: number; y: number }>();

  for (let c = 0; c < visibleCols.length; c++) {
    const kind = visibleCols[c];
    const list = byType.get(kind)!;
    const x = c * COL_WIDTH + 30;
    for (let i = 0; i < list.length; i++) {
      const y = COL_HEADER + 8 + i * (NODE_H + NODE_GAP);
      pos.set(list[i].id, { x, y });
    }
  }

  const nodes: NodeLayout[] = graph.nodes
    .map((n) => {
      const p = pos.get(n.id);
      return p ? { node: n, x: p.x, y: p.y } : null;
    })
    .filter(Boolean) as NodeLayout[];

  const edges: EdgeLayout[] = [];
  for (const e of graph.edges) {
    const a = pos.get(e.src);
    const b = pos.get(e.dst);
    if (!a || !b) continue;
    edges.push({
      edge: e,
      x1: a.x + NODE_W,
      y1: a.y + NODE_H / 2,
      x2: b.x,
      y2: b.y + NODE_H / 2,
    });
  }

  const maxColHeight = Math.max(
    ...visibleCols.map((kind) => (byType.get(kind)?.length ?? 0) * (NODE_H + NODE_GAP)),
  );

  return { byType, nodes, edges, maxColHeight };
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) / 2;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
