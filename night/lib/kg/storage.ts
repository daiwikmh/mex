"use client";

import { useSyncExternalStore } from "react";

export type ConnectedSource = "gmail" | "calendar" | "finance" | "drive";

const SOURCES_KEY = "Omnis:sources:v1";

let rawCache: string | null = null;
let parsedCache: Set<ConnectedSource> = new Set();

export function readConnectedSources(): Set<ConnectedSource> {
  if (typeof window === "undefined") return parsedCache;
  const raw = localStorage.getItem(SOURCES_KEY);
  if (raw === rawCache) return parsedCache;
  rawCache = raw;
  parsedCache = raw ? new Set(JSON.parse(raw) as ConnectedSource[]) : new Set();
  return parsedCache;
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("Omnis:sources-change", cb);
  return () => window.removeEventListener("Omnis:sources-change", cb);
}

export function useConnectedSources(): Set<ConnectedSource> {
  return useSyncExternalStore(subscribe, readConnectedSources, () => new Set<ConnectedSource>());
}

export function writeConnectedSources(sources: Set<ConnectedSource>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOURCES_KEY, JSON.stringify([...sources]));
  window.dispatchEvent(new Event("Omnis:sources-change"));
}

export function toggleSource(source: ConnectedSource): void {
  const current = new Set(readConnectedSources());
  if (current.has(source)) current.delete(source);
  else current.add(source);
  writeConnectedSources(current);
}
