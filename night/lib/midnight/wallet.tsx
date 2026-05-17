"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ConnectedAPI,
  Configuration,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";

const NETWORK_ID = "preprod";
const SUPPORTED_NETWORK_IDS = ["undeployed", "mainnet", "preview", "preprod"] as const;
const COMPATIBLE_API_MAJOR = 4;
const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 4000;
const PERSIST_KEY = "Omnis:wallet:last-rdns";

export type WalletStatus =
  | "idle"
  | "detecting"
  | "no-wallet"
  | "ready"
  | "connecting"
  | "connected"
  | "error";

export type WalletInfo = {
  uuid: string;
  rdns: string;
  name: string;
  icon: string;
  apiVersion: string;
};

export type ConnectedWallet = {
  info: WalletInfo;
  api: ConnectedAPI;
  config: Configuration;
  shieldedAddress: string;
};

interface WalletContextValue {
  status: WalletStatus;
  error: string | null;
  available: WalletInfo[];
  connected: ConnectedWallet | null;
  connect: (uuid?: string) => Promise<void>;
  disconnect: () => void;
  refresh: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function listInjectedWallets(): WalletInfo[] {
  if (typeof window === "undefined") return [];
  const registry = window.midnight;
  if (!registry) return [];
  const out: WalletInfo[] = [];
  for (const [uuid, api] of Object.entries(registry) as [string, InitialAPI][]) {
    if (!api || typeof api.connect !== "function") continue;
    out.push({
      uuid,
      rdns: api.rdns,
      name: api.name,
      icon: api.icon,
      apiVersion: api.apiVersion,
    });
  }
  return out;
}

function isCompatible(apiVersion: string): boolean {
  const major = Number(apiVersion.split(".")[0]);
  return Number.isFinite(major) && major === COMPATIBLE_API_MAJOR;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<WalletInfo[]>([]);
  const [connected, setConnected] = useState<ConnectedWallet | null>(null);
  const pollHandle = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollHandle.current !== null) {
      clearInterval(pollHandle.current);
      pollHandle.current = null;
    }
  }, []);

  const detect = useCallback(() => {
    if (typeof window === "undefined") return;
    setStatus((s) => (s === "connected" ? s : "detecting"));
    const start = Date.now();
    stopPolling();
    pollHandle.current = setInterval(() => {
      const found = listInjectedWallets();
      setAvailable(found);
      if (found.length > 0) {
        stopPolling();
        setStatus((s) => (s === "connected" ? s : "ready"));
      } else if (Date.now() - start > POLL_TIMEOUT_MS) {
        stopPolling();
        setStatus((s) => (s === "connected" ? s : "no-wallet"));
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const connect = useCallback(
    async (uuid?: string) => {
      setError(null);
      const wallets = listInjectedWallets();
      const target =
        wallets.find((w) => w.uuid === uuid) ??
        wallets.find((w) => w.rdns === localStorage.getItem(PERSIST_KEY)) ??
        wallets[0];
      if (!target) {
        setStatus("no-wallet");
        setError("No Midnight wallet detected");
        return;
      }
      if (!isCompatible(target.apiVersion)) {
        setError(`Wallet API ${target.apiVersion} not compatible with v${COMPATIBLE_API_MAJOR}.x`);
        setStatus("error");
        return;
      }
      const injected = window.midnight?.[target.uuid];
      if (!injected) {
        setError("Wallet entry disappeared from window.midnight");
        setStatus("error");
        return;
      }
      setStatus("connecting");
      try {
        let api;
        let lastErr: unknown = null;
        const order = [NETWORK_ID, ...SUPPORTED_NETWORK_IDS.filter((n) => n !== NETWORK_ID)];
        for (const candidate of order) {
          try {
            api = await injected.connect(candidate);
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!api) {
          const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
          throw new Error(`Could not connect Lace on any supported network. ${msg}`);
        }
        const config = await api.getConfiguration();
        const { shieldedAddress } = await api.getShieldedAddresses();
        setConnected({ info: target, api, config, shieldedAddress });
        setStatus("connected");
        localStorage.setItem(PERSIST_KEY, target.rdns);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setStatus("error");
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    setConnected(null);
    setStatus("ready");
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PERSIST_KEY);
    }
  }, []);

  useEffect(() => {
    detect();
    return stopPolling;
  }, [detect, stopPolling]);

  const value = useMemo<WalletContextValue>(
    () => ({ status, error, available, connected, connect, disconnect, refresh: detect }),
    [status, error, available, connected, connect, disconnect, detect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside <WalletProvider>");
  }
  return ctx;
}

export function shortAddress(addr: string, head = 8, tail = 6): string {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export { NETWORK_ID };
