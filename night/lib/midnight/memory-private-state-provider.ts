"use client";

import type {
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from "@midnight-ntwrk/midnight-js-types";
import type { ContractAddress, SigningKey } from "@midnight-ntwrk/compact-runtime";

interface MemoryStoreConfig {
  storageKeyPrefix: string;
  accountId: string;
}

export function createMemoryPrivateStateProvider(
  config: MemoryStoreConfig,
): PrivateStateProvider {
  const ns = `${config.storageKeyPrefix}:${config.accountId}`;
  const stateKey = `${ns}:private-states`;
  const keyKey = `${ns}:signing-keys`;
  let contractAddress: ContractAddress | null = null;

  function load<T>(key: string): Record<string, T> {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    try { return JSON.parse(raw) as Record<string, T>; } catch { return {}; }
  }
  function save<T>(key: string, val: Record<string, T>): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(val));
  }
  function scopedStateKey(id: PrivateStateId): string {
    return contractAddress ? `${contractAddress}:${id}` : `_:${id}`;
  }

  const unsupported = (op: string) => () => {
    throw new Error(`MemoryPrivateStateProvider does not support ${op}`);
  };

  return {
    setContractAddress(address: ContractAddress) {
      contractAddress = address;
    },
    async set(id, state) {
      const all = load<unknown>(stateKey);
      all[scopedStateKey(id)] = state;
      save(stateKey, all);
    },
    async get(id) {
      const all = load<unknown>(stateKey);
      const v = all[scopedStateKey(id)];
      return v === undefined ? null : (v as never);
    },
    async remove(id) {
      const all = load<unknown>(stateKey);
      delete all[scopedStateKey(id)];
      save(stateKey, all);
    },
    async clear() {
      save<unknown>(stateKey, {});
    },
    async setSigningKey(address, signingKey: SigningKey) {
      const all = load<SigningKey>(keyKey);
      all[address] = signingKey;
      save(keyKey, all);
    },
    async getSigningKey(address) {
      const all = load<SigningKey>(keyKey);
      return all[address] ?? null;
    },
    async removeSigningKey(address) {
      const all = load<SigningKey>(keyKey);
      delete all[address];
      save(keyKey, all);
    },
    async clearSigningKeys() {
      save<SigningKey>(keyKey, {});
    },
    exportPrivateStates: unsupported("export") as () => Promise<PrivateStateExport>,
    importPrivateStates: unsupported("import"),
    exportSigningKeys:   unsupported("export") as () => Promise<SigningKeyExport>,
    importSigningKeys:   unsupported("import"),
  };
}
