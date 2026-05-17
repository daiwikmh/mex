import type { EdgeType, NodeType } from "./types";

export interface KgScope {
  nodes: NodeType[];
  edges: EdgeType[];
  maxDepth: number;
  predicates?: string[];
}

export function canonicalize(scope: KgScope): string {
  const obj = {
    nodes: [...scope.nodes].sort(),
    edges: [...scope.edges].sort(),
    maxDepth: scope.maxDepth,
    predicates: [...(scope.predicates ?? [])].sort(),
  };
  return JSON.stringify(obj);
}

export async function scopeHash(scope: KgScope): Promise<string> {
  return sha256Hex(canonicalize(scope));
}

export async function policyHash(
  scope: KgScope,
  expiryMs: number,
  maxQueries: number,
): Promise<string> {
  const canonical = canonicalize(scope);
  return sha256Hex(`${canonical}|${expiryMs}|${maxQueries}`);
}

export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return "0x" + Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return synchronousFallback(input);
}

function synchronousFallback(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return "0x" + (part(h1) + part(h2)).repeat(4).slice(0, 64);
}

export function nodeInScope(nodeType: NodeType, scope: KgScope): boolean {
  return scope.nodes.includes(nodeType);
}

export function edgeInScope(edgeType: EdgeType, scope: KgScope): boolean {
  return scope.edges.includes(edgeType);
}
