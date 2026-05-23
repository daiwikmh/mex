"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAccount, useChainId } from "wagmi";
import { Sidebar, SidebarProvider, useSidebar } from "@/components/mezo/Sidebar";
import { ConnectPrompt, WrongChainPrompt } from "@/components/mezo/panels";
import { activeChain } from "@/lib/mezo/config";

function Gate({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!mounted) return null;
  if (!isConnected) return <ConnectPrompt />;
  if (chainId !== activeChain.id) return <WrongChainPrompt />;
  return <>{children}</>;
}

function Content({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const padLeft = collapsed ? "md:pl-14" : "md:pl-60";
  return (
    <div className={`min-h-dvh ${padLeft} transition-[padding] duration-200`}>
      <main className="mx-auto max-w-5xl px-6 py-12 pt-16 sm:py-16 md:px-10 md:pt-16">
        <Gate>{children}</Gate>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-background text-foreground">
      <SidebarProvider>
        <Sidebar />
        <Content>{children}</Content>
      </SidebarProvider>
    </div>
  );
}
