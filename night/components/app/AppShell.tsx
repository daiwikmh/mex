"use client";

import type { ReactNode } from "react";
import { Sidebar, SidebarProvider, useSidebar } from "./Sidebar";

function Content({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const padLeft = collapsed ? "md:pl-14" : "md:pl-60";
  return (
    <div className={`min-h-dvh ${padLeft} transition-[padding] duration-200`}>
      <main className="max-w-6xl px-6 py-10 sm:py-14 md:pl-8 md:pr-10">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode; active?: string }) {
  return (
    <div className="bg-background text-foreground">
      <SidebarProvider>
        <Sidebar />
        <Content>{children}</Content>
      </SidebarProvider>
    </div>
  );
}
