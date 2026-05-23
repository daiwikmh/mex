"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { activeChain } from "@/lib/mezo/config";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const pill =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors";

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Avoid hydration mismatch: wallet state only resolves on the client.
  if (!mounted) {
    return <span className={`${pill} border border-border bg-surface text-foreground/50`}>Connect wallet</span>;
  }

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <button
        type="button"
        disabled={!injected || isPending}
        onClick={() => injected && connect({ connector: injected })}
        className={`${pill} bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50`}
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  if (chainId !== activeChain.id) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: activeChain.id })}
        className={`${pill} bg-accent text-background hover:bg-accent/90`}
      >
        Switch to {activeChain.name}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`${pill} border border-border bg-surface text-foreground`}>
        <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
        {address ? shortAddress(address) : "Connected"}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className={`${pill} text-foreground/60 hover:bg-foreground/5 hover:text-foreground`}
      >
        Disconnect
      </button>
    </div>
  );
}
