"use client";

import { useSyncExternalStore } from "react";
import { sha256Hex, type KgScope } from "./kg/scope";

export type AgentScope = {
  source: string;
  read: boolean;
  write: boolean;
  filters: string[];
};

export type AgentPolicy = {
  scopes: AgentScope[];
  kgScope: KgScope | null;
  kgSeedNodeId: string | null;
  expiryMs: number;
  maxQueries: number;
  spendCeilingUsd: number;
};

export type AgentState = {
  agentId: string;
  agentLabel: string;
  ownerCommitment: string;
  policy: AgentPolicy;
  policyHash: string;
  scopeHash: string;
  registeredAt: number;
  revokedAt: number | null;
  contractAddress: string | null;
  registerTxHash: string | null;
};

export type QueryReceipt = {
  agentId: string;
  queryHash: string;
  queryLabel: string;
  resultCommitment: string;
  paymentUsd: number;
  ts: number;
  txHash: string | null;
  allowed: boolean;
  visitedNodeIds?: string[];
  visitedEdgeIds?: string[];
  abortReason?: string | null;
};

const AGENT_KEY = "Omnis:agent:v2";
const QUERIES_KEY = "Omnis:queries:v2";

let agentRawCache: string | null = null;
let agentParsedCache: AgentState | null = null;

export function readAgent(): AgentState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AGENT_KEY);
  if (raw === agentRawCache) return agentParsedCache;
  agentRawCache = raw;
  agentParsedCache = raw ? (JSON.parse(raw) as AgentState) : null;
  return agentParsedCache;
}

function subscribeAgent(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("Omnis:agent-change", cb);
  return () => window.removeEventListener("Omnis:agent-change", cb);
}

export function useStoredAgent(): AgentState | null {
  return useSyncExternalStore(subscribeAgent, readAgent, () => null);
}

export function writeAgent(a: AgentState | null): void {
  if (typeof window === "undefined") return;
  if (a === null) localStorage.removeItem(AGENT_KEY);
  else localStorage.setItem(AGENT_KEY, JSON.stringify(a));
  window.dispatchEvent(new Event("Omnis:agent-change"));
}

let queriesRawCache: string | null = null;
let queriesParsedCache: QueryReceipt[] = [];

export function readQueries(): QueryReceipt[] {
  if (typeof window === "undefined") return queriesParsedCache;
  const raw = localStorage.getItem(QUERIES_KEY);
  if (raw === queriesRawCache) return queriesParsedCache;
  queriesRawCache = raw;
  queriesParsedCache = raw ? (JSON.parse(raw) as QueryReceipt[]) : [];
  return queriesParsedCache;
}

function subscribeQueries(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("Omnis:queries-change", cb);
  return () => window.removeEventListener("Omnis:queries-change", cb);
}

export function useStoredQueries(): QueryReceipt[] {
  const EMPTY: QueryReceipt[] = [];
  return useSyncExternalStore(subscribeQueries, readQueries, () => EMPTY);
}

export function appendQuery(q: QueryReceipt): void {
  if (typeof window === "undefined") return;
  const list = readQueries();
  list.push(q);
  localStorage.setItem(QUERIES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("Omnis:queries-change"));
}

export function clearQueries(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUERIES_KEY);
  window.dispatchEvent(new Event("Omnis:queries-change"));
}

export async function hashPolicy(p: AgentPolicy): Promise<string> {
  const kg = p.kgScope
    ? JSON.stringify({
        nodes: [...p.kgScope.nodes].sort(),
        edges: [...p.kgScope.edges].sort(),
        maxDepth: p.kgScope.maxDepth,
      })
    : "{}";
  return sha256Hex(`${kg}|${p.expiryMs}|${p.maxQueries}|${p.spendCeilingUsd}`);
}

export interface AgentTemplate {
  id: string;
  label: string;
  description: string;
  scopes: AgentScope[];
  kgScope: KgScope;
  kgSeedNodeId: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "invoice-triage",
    label: "Invoice triage",
    description: "Reads incoming invoice emails, summarises, flags duplicates.",
    scopes: [
      { source: "gmail",  read: true, write: false, filters: ["subject:invoice OR attachment:pdf"] },
      { source: "stripe", read: true, write: false, filters: ["invoice.* events"] },
    ],
    kgScope: {
      nodes: ["Email", "Invoice"],
      edges: ["attached_to", "sent_by", "follows_up"],
      maxDepth: 2,
    },
    kgSeedNodeId: "e1",
  },
  {
    id: "spend-watcher",
    label: "Spend watcher",
    description: "Reads transaction emails, traces charges to invoices. Cannot move funds.",
    scopes: [
      { source: "gmail",  read: true, write: false, filters: ["subject:receipt OR subject:invoice"] },
      { source: "stripe", read: true, write: false, filters: ["charge.* events"] },
    ],
    kgScope: {
      nodes: ["Email", "Invoice", "Charge"],
      edges: ["attached_to", "charged_for"],
      maxDepth: 2,
    },
    kgSeedNodeId: "ch1",
  },
  {
    id: "calendar-defender",
    label: "Calendar defender",
    description: "Declines meetings outside policy hours, never sends on your behalf.",
    scopes: [
      { source: "calendar", read: true, write: true, filters: ["read-only outside 9-18"] },
    ],
    kgScope: {
      nodes: ["Meeting", "Contact"],
      edges: ["attended_by"],
      maxDepth: 1,
    },
    kgSeedNodeId: "m1",
  },
  {
    id: "vendor-map",
    label: "Vendor map",
    description: "Maps a vendor's full footprint across emails, contracts and invoices.",
    scopes: [
      { source: "gmail",  read: true, write: false, filters: ["per-vendor thread"] },
      { source: "drive",  read: true, write: false, filters: ["MSA + SOW"] },
    ],
    kgScope: {
      nodes: ["Contact", "Email", "Invoice", "Document"],
      edges: ["sent_by", "attached_to", "mentions"],
      maxDepth: 3,
    },
    kgSeedNodeId: "c4",
  },
];
