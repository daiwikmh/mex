"use client";

import { useMemo, useState } from "react";
import type { KgEdge, KgNode, KnowledgeGraph, NodeType } from "@/lib/kg/types";
import { edgeInScope, nodeInScope, type KgScope } from "@/lib/kg/scope";

interface Props {
  graph: KnowledgeGraph;
  scope?: KgScope;
  visitedNodeIds?: Set<string>;
  visitedEdgeIds?: Set<string>;
  currentNodeId?: string | null;
  onNodeClick?: (node: KgNode) => void;
  onEdgeClick?: (edge: KgEdge) => void;
  height?: number;
}

const TYPE_ORDER: NodeType[] = [
  "Email",
  "Contact",
  "Invoice",
  "Charge",
  "Meeting",
  "Document",
];

const TYPE_COLORS: Record<NodeType, { bg: string; ring: string; fg: string }> = {
  Email:    { bg: "#0f5a37", ring: "#0a4129", fg: "#e8f0d8" },
  Contact:  { bg: "#1a1607", ring: "#1a1607", fg: "#eef2dc" },
  Invoice:  { bg: "#c97a4a", ring: "#9a5a35", fg: "#1a1607" },
  Charge:   { bg: "#efe7a4", ring: "#a9a07a", fg: "#1a1607" },
  Meeting:  { bg: "#f4f6e6", ring: "#1a1607", fg: "#1a1607" },
  Document: { bg: "#cdd9ff", ring: "#7c8cd4", fg: "#1a1607" },
};

const COLUMN_LABELS: Record<NodeType, string> = {
  Email:    "Emails",
  Contact:  "Contacts",
  Invoice:  "Invoices",
  Charge:   "Charges",
  Meeting:  "Meetings",
  Document: "Documents",
};

const COL_WIDTH = 200;
const NODE_W = 168;
const NODE_H = 38;
const NODE_GAP = 8;
const COL_HEADER = 32;

export function GraphView({
  graph,
  scope,
  visitedNodeIds,
  visitedEdgeIds,
  currentNodeId,
  onNodeClick,
  onEdgeClick,
  height = 560,
}: Props) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  const layout = useMemo(() => computeLayout(graph), [graph]);

  const visibleCols = TYPE_ORDER.filter((t) => (layout.byType.get(t)?.length ?? 0) > 0);
  const width = visibleCols.length * COL_WIDTH + 60;

  return (
    <div className="relative w-full overflow-auto rounded-2xl border border-foreground/15 bg-surface" style={{ height }}>
      <svg width={width} height={Math.max(height, layout.maxColHeight + COL_HEADER + 60)} className="block">
        <defs>
          <marker id="kg-arrow"        viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a1607" opacity="0.5" />
          </marker>
          <marker id="kg-arrow-visit"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f5a37" />
          </marker>
          <marker id="kg-arrow-block"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a4262c" />
          </marker>
        </defs>

        {visibleCols.map((kind, colIdx) => {
          const inScope = scope ? nodeInScope(kind, scope) : true;
          return (
            <text
              key={`hdr-${kind}`}
              x={colIdx * COL_WIDTH + 30 + NODE_W / 2}
              y={20}
              textAnchor="middle"
              className="font-mono"
              fontSize="10"
              fill="#1a1607"
              opacity={inScope ? 0.7 : 0.3}
              style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              {COLUMN_LABELS[kind]} ({layout.byType.get(kind)?.length ?? 0}){inScope ? "" : " · out"}
            </text>
          );
        })}

        {layout.edges.map((e) => {
          const isHover = hoverEdge === e.edge.id;
          const isNodeHover = hoverNode && (e.edge.from === hoverNode || e.edge.to === hoverNode);
          const visited = visitedEdgeIds?.has(e.edge.id);
          const edgeAllowed = scope ? edgeInScope(e.edge.type, scope) : true;
          const aOk = scope ? nodeInScope(getNode(graph, e.edge.from)?.type ?? "Email", scope) : true;
          const bOk = scope ? nodeInScope(getNode(graph, e.edge.to)?.type ?? "Email", scope) : true;
          const blocked = scope ? (!edgeAllowed || !aOk || !bOk) : false;

          let stroke = "#1a1607";
          let opacity = 0.18;
          let marker = "url(#kg-arrow)";
          if (visited) { stroke = "#0f5a37"; opacity = 0.85; marker = "url(#kg-arrow-visit)"; }
          else if (blocked && (isHover || isNodeHover)) { stroke = "#a4262c"; opacity = 0.5; marker = "url(#kg-arrow-block)"; }
          else if (blocked) { stroke = "#1a1607"; opacity = 0.06; }
          else if (isHover || isNodeHover) { opacity = 0.55; }

          return (
            <g key={e.edge.id}>
              <path
                d={curve(e.x1, e.y1, e.x2, e.y2)}
                fill="none"
                stroke={stroke}
                strokeWidth={visited ? 1.8 : (isHover || isNodeHover) ? 1.4 : 0.8}
                strokeDasharray={blocked && !visited ? "3 4" : undefined}
                opacity={opacity}
                markerEnd={marker}
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
          const visited = visitedNodeIds?.has(p.node.id);
          const current = currentNodeId === p.node.id;
          const inScope = scope ? nodeInScope(p.node.type, scope) : true;
          const dim = scope && !inScope;

          return (
            <g
              key={p.node.id}
              transform={`translate(${p.x}, ${p.y})`}
              onMouseEnter={() => setHoverNode(p.node.id)}
              onMouseLeave={() => setHoverNode(null)}
              onClick={() => onNodeClick?.(p.node)}
              style={{ cursor: onNodeClick ? "pointer" : "default" }}
            >
              {current && (
                <rect
                  x={-4}
                  y={-4}
                  width={NODE_W + 8}
                  height={NODE_H + 8}
                  rx={12}
                  fill="none"
                  stroke="#0f5a37"
                  strokeWidth={2}
                  opacity={0.9}
                />
              )}
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill={col.bg}
                stroke={visited ? "#0f5a37" : col.ring}
                strokeWidth={visited ? 2 : isHover ? 2 : 1.2}
                opacity={dim ? 0.35 : visited ? 1 : 0.96}
              />
              <text
                x={12}
                y={NODE_H / 2 - 2}
                fontSize="9"
                fill={col.fg}
                opacity={0.65}
                style={{ fontFamily: "ui-monospace, monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                {p.node.type}{p.node.private ? " · private" : ""}
              </text>
              <text
                x={12}
                y={NODE_H / 2 + 11}
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
  node: KgNode;
  x: number;
  y: number;
}

interface EdgeLayout {
  edge: KgEdge;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getNode(graph: KnowledgeGraph, id: string): KgNode | undefined {
  return graph.nodes.find((x) => x.id === id);
}

function computeLayout(graph: KnowledgeGraph): {
  byType: Map<NodeType, KgNode[]>;
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  maxColHeight: number;
} {
  const byType = new Map<NodeType, KgNode[]>();
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
    const a = pos.get(e.from);
    const b = pos.get(e.to);
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
