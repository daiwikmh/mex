"use client";

import { shortHash } from "./mock";

export type AgentScope = {
  source: string;
  read: boolean;
  write: boolean;
  filters: string[];
};

export type AgentPolicy = {
  scopes: AgentScope[];
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
};

const AGENT_KEY = "nocturne:agent:v1";
const QUERIES_KEY = "nocturne:queries:v1";

export function readAgent(): AgentState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AGENT_KEY);
  return raw ? (JSON.parse(raw) as AgentState) : null;
}

export function writeAgent(a: AgentState | null): void {
  if (typeof window === "undefined") return;
  if (a === null) localStorage.removeItem(AGENT_KEY);
  else localStorage.setItem(AGENT_KEY, JSON.stringify(a));
  window.dispatchEvent(new Event("nocturne:agent-change"));
}

export function readQueries(): QueryReceipt[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(QUERIES_KEY);
  return raw ? (JSON.parse(raw) as QueryReceipt[]) : [];
}

export function appendQuery(q: QueryReceipt): void {
  if (typeof window === "undefined") return;
  const list = readQueries();
  list.push(q);
  localStorage.setItem(QUERIES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("nocturne:queries-change"));
}

export function clearQueries(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUERIES_KEY);
  window.dispatchEvent(new Event("nocturne:queries-change"));
}

export function hashPolicy(p: AgentPolicy): string {
  return shortHash(JSON.stringify(p));
}

export const DEFAULT_SCOPES: AgentScope[] = [
  { source: "gmail",     read: true,  write: false, filters: ["from:billing@stripe.com"] },
  { source: "calendar",  read: true,  write: false, filters: ["next 30 days"] },
  { source: "stripe",    read: true,  write: false, filters: ["invoice.* events"] },
];

export const AGENT_TEMPLATES = [
  {
    id: "invoice-triage",
    label: "Invoice triage",
    description: "Reads incoming invoice emails, summarises, flags duplicates.",
    scopes: DEFAULT_SCOPES,
  },
  {
    id: "calendar-defender",
    label: "Calendar defender",
    description: "Declines meetings outside policy hours, never sends on your behalf.",
    scopes: [
      { source: "calendar", read: true, write: true, filters: ["read-only outside 9-18"] },
    ] as AgentScope[],
  },
  {
    id: "spend-watcher",
    label: "Spend watcher",
    description: "Reads transaction emails, alerts on anomalies. Cannot move funds.",
    scopes: [
      { source: "gmail",  read: true, write: false, filters: ["subject:receipt OR subject:invoice"] },
      { source: "stripe", read: true, write: false, filters: ["charge.* events"] },
    ] as AgentScope[],
  },
] as const;
