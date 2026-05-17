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
import { useWallet } from "./wallet";
import { buildProviders, type AgentRegistryProviders } from "./providers";
import {
  ensureRegistry,
  readRegistryAddress,
  writeRegistryAddress,
} from "./agent-registry-client";

export type RuntimeStatus =
  | "idle"
  | "no-wallet"
  | "preparing"
  | "deploying"
  | "ready"
  | "error";

interface RuntimeContextValue {
  status: RuntimeStatus;
  error: string | null;
  providers: AgentRegistryProviders | null;
  registry: any | null;
  registryAddress: string | null;
  freshlyDeployed: boolean;
  reconnect: () => Promise<void>;
  resetRegistry: () => void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

export function MidnightRuntimeProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [status, setStatus] = useState<RuntimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<AgentRegistryProviders | null>(null);
  const [registry, setRegistry] = useState<any | null>(null);
  const [registryAddress, setRegistryAddress] = useState<string | null>(null);
  const [freshlyDeployed, setFreshlyDeployed] = useState(false);
  const busy = useRef(false);

  const initialize = useCallback(async () => {
    if (!wallet.connected) {
      setStatus("no-wallet");
      setProviders(null);
      setRegistry(null);
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setStatus("preparing");

    try {
      const built = await buildProviders(wallet.connected);
      setProviders(built);
      setStatus("deploying");

      const result = await ensureRegistry(built);
      setRegistry(result.contract);
      setRegistryAddress(result.address);
      setFreshlyDeployed(result.freshlyDeployed);
      setStatus("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Midnight runtime init failed", e);
      setError(msg);
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }, [wallet.connected]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const resetRegistry = useCallback(() => {
    writeRegistryAddress(null);
    setRegistry(null);
    setRegistryAddress(null);
    setFreshlyDeployed(false);
    setStatus("idle");
  }, []);

  const value = useMemo<RuntimeContextValue>(
    () => ({
      status,
      error,
      providers,
      registry,
      registryAddress: registryAddress ?? readRegistryAddress(),
      freshlyDeployed,
      reconnect: initialize,
      resetRegistry,
    }),
    [status, error, providers, registry, registryAddress, freshlyDeployed, initialize, resetRegistry],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): RuntimeContextValue {
  const ctx = useContext(RuntimeContext);
  if (!ctx) throw new Error("useRuntime must be used inside <MidnightRuntimeProvider>");
  return ctx;
}
