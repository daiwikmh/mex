"use client";

import type { UnderwritingResult } from "./mock";

const VAULT_KEY = "nocturne:vault:v1";
const RESULT_KEY = "nocturne:result:v1";

export type VaultState = {
  fileName: string;
  byteLength: number;
  ciphertextHash: string;
  commitment: string;
  registeredAt: number;
  policy: {
    queryTypes: string[];
    maxUsesPerWeek: number;
    minRoyalty: number;
  };
};

export function readVault(): VaultState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VAULT_KEY);
  return raw ? (JSON.parse(raw) as VaultState) : null;
}

export function writeVault(v: VaultState | null): void {
  if (typeof window === "undefined") return;
  if (v === null) localStorage.removeItem(VAULT_KEY);
  else localStorage.setItem(VAULT_KEY, JSON.stringify(v));
  window.dispatchEvent(new Event("nocturne:vault-change"));
}

export function readResult(): UnderwritingResult | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(RESULT_KEY);
  return raw ? (JSON.parse(raw) as UnderwritingResult) : null;
}

export function writeResult(r: UnderwritingResult | null): void {
  if (typeof window === "undefined") return;
  if (r === null) localStorage.removeItem(RESULT_KEY);
  else localStorage.setItem(RESULT_KEY, JSON.stringify(r));
  window.dispatchEvent(new Event("nocturne:result-change"));
}
