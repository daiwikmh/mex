"use client";

import { shortHash } from "./mock";

// ---- typed entity / edge schema --------------------------------------------

export type EntityKind =
  | "account"
  | "transaction"
  | "merchant"
  | "income_stream"
  | "debt_obligation"
  | "recurring_charge";

export type EdgeKind =
  | "paid_to"           // Transaction -> Merchant         (negative amount)
  | "earned_from"       // Transaction -> Merchant         (positive amount)
  | "belongs_to"        // Transaction -> Account
  | "represents"        // Transaction -> IncomeStream | DebtObligation | RecurringCharge
  | "recurring_with"    // Merchant -> IncomeStream | DebtObligation | RecurringCharge
  | "overdrew_at";      // Account -> Transaction          (transaction left account negative)

export interface GraphNode {
  id: string;
  type: EntityKind;
  label: string;
  attrs: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  src: string;
  dst: string;
  type: EdgeKind;
  evidence: string;       // raw CSV row text or summary
  amount?: number;        // signed amount in dollars
  observed_at?: string;   // ISO date
}

export interface FinancialGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: { fileName: string; rowCount: number; createdAt: number };
}

// ---- CSV parse + entity extraction -----------------------------------------

interface CsvRow {
  date: string;          // ISO yyyy-mm-dd
  description: string;
  amount: number;        // signed dollars
  category?: string;
  account?: string;
}

const HEADER_ALIASES: Record<keyof CsvRow, string[]> = {
  date:        ["date", "posted", "posting date", "transaction date"],
  description: ["description", "name", "merchant", "memo"],
  amount:      ["amount", "amt", "value"],
  category:    ["category", "type"],
  account:     ["account", "account name"],
};

function pickHeader(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const a of aliases) {
    const i = lower.indexOf(a);
    if (i >= 0) return i;
  }
  return -1;
}

export function parseBankCsv(csv: string): CsvRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const idx = {
    date:        pickHeader(headers, HEADER_ALIASES.date),
    description: pickHeader(headers, HEADER_ALIASES.description),
    amount:      pickHeader(headers, HEADER_ALIASES.amount),
    category:    pickHeader(headers, HEADER_ALIASES.category),
    account:     pickHeader(headers, HEADER_ALIASES.account),
  };
  if (idx.date < 0 || idx.description < 0 || idx.amount < 0) return [];

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const raw = cols[idx.amount] ?? "0";
    const cleaned = raw.replace(/[$,]/g, "").trim();
    const amount = Number(cleaned);
    if (!Number.isFinite(amount)) continue;
    rows.push({
      date:        cols[idx.date] ?? "",
      description: cols[idx.description] ?? "",
      amount,
      category:    idx.category >= 0 ? cols[idx.category] : undefined,
      account:     idx.account  >= 0 ? cols[idx.account]  : undefined,
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// ---- graph construction ----------------------------------------------------

const RECURRING_MIN_HITS = 3;

export function buildGraph(rows: CsvRow[], fileName: string): FinancialGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  function addNode(n: GraphNode): void {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    nodes.push(n);
  }

  function addEdge(e: GraphEdge): void {
    edges.push(e);
  }

  // --- accounts ---
  const accountSet = new Set<string>();
  for (const r of rows) {
    const acc = (r.account ?? "Checking").trim() || "Checking";
    accountSet.add(acc);
  }
  for (const acc of accountSet) {
    addNode({
      id: `account:${slug(acc)}`,
      type: "account",
      label: acc,
      attrs: { name: acc },
    });
  }

  // --- merchants (deduplicated by normalized name) ---
  const merchantHits = new Map<string, { name: string; amounts: number[]; dates: string[] }>();
  for (const r of rows) {
    const key = merchantKey(r.description);
    const existing = merchantHits.get(key) ?? { name: r.description, amounts: [], dates: [] };
    existing.amounts.push(r.amount);
    existing.dates.push(r.date);
    merchantHits.set(key, existing);
  }
  for (const [key, m] of merchantHits.entries()) {
    addNode({
      id: `merchant:${key}`,
      type: "merchant",
      label: m.name,
      attrs: { hits: m.amounts.length, sum: round(m.amounts.reduce((a, b) => a + b, 0)) },
    });
  }

  // --- transactions, paid_to / earned_from / belongs_to edges ---
  let txIdx = 0;
  for (const r of rows) {
    const acc = (r.account ?? "Checking").trim() || "Checking";
    const accountId = `account:${slug(acc)}`;
    const merchId = `merchant:${merchantKey(r.description)}`;
    const txId = `tx:${shortHash(`${r.date}:${r.description}:${r.amount}:${txIdx++}`)}`;

    addNode({
      id: txId,
      type: "transaction",
      label: `${r.description.slice(0, 24)} ${r.amount.toFixed(2)}`,
      attrs: {
        date: r.date,
        amount: r.amount,
        description: r.description,
        category: r.category ?? null,
        account: acc,
      },
    });

    addEdge({
      id: `e:${txId}:belongs_to`,
      src: txId,
      dst: accountId,
      type: "belongs_to",
      evidence: `${r.date} ${r.description} ${money(r.amount)}`,
      amount: r.amount,
      observed_at: r.date,
    });

    addEdge({
      id: `e:${txId}:${r.amount < 0 ? "paid_to" : "earned_from"}`,
      src: txId,
      dst: merchId,
      type: r.amount < 0 ? "paid_to" : "earned_from",
      evidence: `${r.date} ${r.description} ${money(r.amount)}`,
      amount: r.amount,
      observed_at: r.date,
    });
  }

  // --- recurring streams (>= 3 hits, sign-consistent) ---
  for (const [key, m] of merchantHits.entries()) {
    if (m.amounts.length < RECURRING_MIN_HITS) continue;
    const allPositive = m.amounts.every((a) => a > 0);
    const allNegative = m.amounts.every((a) => a < 0);
    if (!allPositive && !allNegative) continue;

    const monthlyAvg = round(m.amounts.reduce((a, b) => a + b, 0) / monthsSpan(m.dates));
    let kind: EntityKind;
    if (allPositive) kind = "income_stream";
    else if (isLikelyDebt(m.name)) kind = "debt_obligation";
    else kind = "recurring_charge";

    const streamId = `${kind}:${key}`;
    addNode({
      id: streamId,
      type: kind,
      label: m.name,
      attrs: {
        monthly_avg: monthlyAvg,
        hit_count: m.amounts.length,
        first_seen: m.dates.reduce((a, b) => (a < b ? a : b)),
        last_seen:  m.dates.reduce((a, b) => (a > b ? a : b)),
      },
    });

    addEdge({
      id: `e:${key}:recurring_with:${kind}`,
      src: `merchant:${key}`,
      dst: streamId,
      type: "recurring_with",
      evidence: `${m.amounts.length} payments, monthly avg ${money(monthlyAvg)}`,
      amount: monthlyAvg,
    });
  }

  return {
    nodes,
    edges,
    source: { fileName, rowCount: rows.length, createdAt: Date.now() },
  };
}

// ---- helpers ---------------------------------------------------------------

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function merchantKey(desc: string): string {
  return slug(
    desc
      .toLowerCase()
      .replace(/#\d+|x{4,}\d+|\d{4,}/g, "")
      .replace(/(card|debit|payment|ach|pos|purchase|deposit|withdrawal|online|recurring|autopay)\b/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  ).slice(0, 40) || "unknown";
}

function isLikelyDebt(name: string): boolean {
  const n = name.toLowerCase();
  return /\b(loan|mortgage|credit|amex|chase|capital one|discover|student|car payment|auto)\b/.test(n);
}

function monthsSpan(dates: string[]): number {
  if (dates.length < 2) return 1;
  const ts = dates.map((d) => Date.parse(d)).filter(Number.isFinite);
  if (ts.length < 2) return 1;
  const min = Math.min(...ts);
  const max = Math.max(...ts);
  const months = (max - min) / (1000 * 60 * 60 * 24 * 30);
  return Math.max(1, Math.round(months));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function money(n: number): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

// ---- localStorage persistence ----------------------------------------------

const GRAPH_KEY = "nocturne:graph:v1";

export function readGraph(): FinancialGraph | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GRAPH_KEY);
  return raw ? (JSON.parse(raw) as FinancialGraph) : null;
}

export function writeGraph(g: FinancialGraph | null): void {
  if (typeof window === "undefined") return;
  if (g === null) localStorage.removeItem(GRAPH_KEY);
  else localStorage.setItem(GRAPH_KEY, JSON.stringify(g));
  window.dispatchEvent(new Event("nocturne:graph-change"));
}
