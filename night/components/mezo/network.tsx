"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type VaultNetwork = "mainnet" | "testnet";

const STORAGE_KEY = "Steward:vault-network";

type Ctx = {
  network: VaultNetwork;
  setNetwork: (n: VaultNetwork) => void;
  toggle: () => void;
};

const VaultNetworkContext = createContext<Ctx | null>(null);

export function VaultNetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<VaultNetwork>("mainnet");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "mainnet" || saved === "testnet") setNetworkState(saved);
  }, []);

  const setNetwork = useCallback((n: VaultNetwork) => {
    setNetworkState(n);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, n);
  }, []);

  const toggle = useCallback(() => {
    setNetworkState((cur) => {
      const next = cur === "mainnet" ? "testnet" : "mainnet";
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <VaultNetworkContext.Provider value={{ network, setNetwork, toggle }}>
      {children}
    </VaultNetworkContext.Provider>
  );
}

export function useVaultNetwork(): Ctx {
  const ctx = useContext(VaultNetworkContext);
  if (!ctx) throw new Error("useVaultNetwork must be used within VaultNetworkProvider");
  return ctx;
}
