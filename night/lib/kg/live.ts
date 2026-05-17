"use client";

import { useSyncExternalStore } from "react";
import type { KgNode, KgEdge } from "./types";
import type { ConnectedSource } from "./storage";

export interface LiveGraph {
  nodes: KgNode[];
  edges: KgEdge[];
}

const LIVE_KEY = "Omnis:live-kg:v1";

let rawCache: string | null = null;
let parsedCache: LiveGraph = { nodes: [], edges: [] };

export function readLiveGraph(): LiveGraph {
  if (typeof window === "undefined") return parsedCache;
  const raw = localStorage.getItem(LIVE_KEY);
  if (raw === rawCache) return parsedCache;
  rawCache = raw;
  parsedCache = raw ? (JSON.parse(raw) as LiveGraph) : { nodes: [], edges: [] };
  return parsedCache;
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("Omnis:live-kg-change", cb);
  return () => window.removeEventListener("Omnis:live-kg-change", cb);
}

export function useLiveGraph(): LiveGraph {
  return useSyncExternalStore(subscribe, readLiveGraph, () => ({ nodes: [], edges: [] }));
}

function persist(graph: LiveGraph): void {
  const raw = JSON.stringify(graph);
  localStorage.setItem(LIVE_KEY, raw);
  rawCache = raw;
  parsedCache = graph;
  window.dispatchEvent(new Event("Omnis:live-kg-change"));
}

export function writeLiveSource(
  source: ConnectedSource,
  data: LiveGraph,
): void {
  if (typeof window === "undefined") return;
  const current = readLiveGraph();
  const existingIds = new Set(current.nodes.filter((n) => n.source === source).map((n) => n.id));

  const otherNodes = current.nodes.filter((n) => n.source !== source);
  const otherEdges = current.edges.filter(
    (e) => !existingIds.has(e.from) && !existingIds.has(e.to),
  );

  persist({
    nodes: [...otherNodes, ...data.nodes],
    edges: [...otherEdges, ...data.edges],
  });
}

export function clearLiveSource(source: ConnectedSource): void {
  if (typeof window === "undefined") return;
  const current = readLiveGraph();
  const removed = new Set(current.nodes.filter((n) => n.source === source).map((n) => n.id));

  persist({
    nodes: current.nodes.filter((n) => n.source !== source),
    edges: current.edges.filter((e) => !removed.has(e.from) && !removed.has(e.to)),
  });
}
