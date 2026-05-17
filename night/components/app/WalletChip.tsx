"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddress, useWallet, type WalletStatus } from "@/lib/midnight/wallet";

const STATUS_DOT: Record<WalletStatus, string> = {
  idle:       "bg-foreground/30",
  detecting:  "bg-amber-600 animate-pulse",
  "no-wallet":"bg-red-700",
  ready:      "bg-amber-500",
  connecting: "bg-emerald-700 animate-pulse",
  connected:  "bg-emerald-700",
  error:      "bg-red-700",
};

const STATUS_LABEL: Record<WalletStatus, string> = {
  idle:       "wallet idle",
  detecting:  "scanning…",
  "no-wallet":"no wallet",
  ready:      "click to connect",
  connecting: "connecting…",
  connected:  "midnight · testnet",
  error:      "wallet error",
};

export function WalletChip({ compact }: { compact?: boolean }) {
  const { status, error, available, connected, connect, disconnect, refresh } = useWallet();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function onChipClick() {
    if (status === "no-wallet" || status === "error") {
      refresh();
      setOpen(true);
      return;
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative">
      <button
        onClick={onChipClick}
        className={`flex items-center gap-2 ${compact ? "" : "min-w-0"} text-left`}
        title={status === "connected" && connected ? connected.shieldedAddress : STATUS_LABEL[status]}
      >
        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
        {!compact && (
          <span className="text-foreground/70 uppercase tracking-widest text-xs truncate">
            {status === "connected" && connected
              ? shortAddress(connected.shieldedAddress, 6, 4)
              : STATUS_LABEL[status]}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-foreground/15 bg-surface p-4 shadow-xl z-50"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
            Midnight wallet
          </div>

          {status === "connected" && connected ? (
            <ConnectedView
              address={connected.shieldedAddress}
              name={connected.info.name}
              onDisconnect={() => {
                disconnect();
                setOpen(false);
              }}
            />
          ) : status === "no-wallet" ? (
            <NoWalletView onRefresh={refresh} />
          ) : (
            <PickWalletView
              available={available}
              onConnect={async (uuid) => {
                await connect(uuid);
                setOpen(false);
              }}
              busy={status === "connecting"}
            />
          )}

          {error && (
            <div className="mt-3 rounded-md border border-red-700/40 bg-red-700/[0.06] px-3 py-2 font-mono text-[11px] text-foreground">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectedView({
  address,
  name,
  onDisconnect,
}: {
  address: string;
  name: string;
  onDisconnect: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="text-sm font-medium text-foreground">{name}</div>
      <div className="mt-2 rounded-md border border-foreground/15 bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-foreground/85 break-all">
        {address}
      </div>
      <button
        onClick={onDisconnect}
        className="mt-3 w-full rounded-md border border-foreground/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:bg-surface-2"
      >
        Disconnect
      </button>
    </div>
  );
}

function PickWalletView({
  available,
  onConnect,
  busy,
}: {
  available: { uuid: string; name: string; icon: string; apiVersion: string }[];
  onConnect: (uuid: string) => void;
  busy: boolean;
}) {
  if (available.length === 0) {
    return (
      <p className="mt-3 text-xs text-foreground/65">
        Scanning <code className="font-mono">window.midnight</code>. Install Lace (Midnight) and reload.
      </p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {available.map((w) => (
        <li key={w.uuid}>
          <button
            onClick={() => onConnect(w.uuid)}
            disabled={busy}
            className="flex w-full items-center gap-3 rounded-md border border-foreground/15 bg-surface-2 px-3 py-2 text-left hover:bg-surface disabled:opacity-50"
          >
            {w.icon && (
              <img
                src={w.icon}
                alt=""
                className="h-6 w-6 rounded"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{w.name}</div>
              <div className="truncate font-mono text-[10px] text-foreground/55">
                api {w.apiVersion}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NoWalletView({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="mt-3 flex flex-col gap-3 text-xs text-foreground/70">
      <p>
        No Midnight wallet found. Install Lace (Midnight) and reload, then click
        retry below.
      </p>
      <button
        onClick={onRefresh}
        className="rounded-md border border-foreground/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:bg-surface-2"
      >
        Retry detection
      </button>
    </div>
  );
}
