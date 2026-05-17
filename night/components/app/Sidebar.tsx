"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { WalletChip } from "./WalletChip";

interface NavItem {
  href: string;
  label: string;
  letter: string;
}

const NAV: NavItem[] = [
  { href: "/app/agents",   label: "Agents",   letter: "A" },
  { href: "/app/policies", label: "Policies", letter: "P" },
  { href: "/app/graph",    label: "Graph",    letter: "G" },
  { href: "/app/activity", label: "Activity", letter: "Q" },
  { href: "/app/demo",     label: "Demo",     letter: "D" },
  { href: "/app/audit",    label: "Audit",    letter: "U" },
];

const STORAGE_KEY = "Omnis:sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function activeHref(pathname: string): string | null {
  let match: string | null = null;
  for (const item of NAV) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (!match || item.href.length > match.length) match = item.href;
    }
  }
  return match;
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  const widthClass = collapsed ? "w-14" : "w-60";
  const currentActive = activeHref(pathname);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-background text-foreground border-r border-foreground/15">
      <div
        className={`flex items-center px-4 py-3 border-b border-foreground/15 ${
          collapsed ? "justify-center" : "justify-start"
        }`}
      >
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5"
          title="Home"
        >
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-foreground" />
          {!collapsed && (
            <span className="font-serif text-lg text-foreground">Omnis</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((item) => {
          const active = currentActive === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`group flex items-center gap-3 px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors border-l-2 ${
                active
                  ? "text-foreground border-foreground bg-surface"
                  : "text-foreground/55 border-transparent hover:text-foreground hover:bg-surface/60"
              }`}
            >
              <span
                className={`shrink-0 w-3 text-center ${
                  active ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/80"
                }`}
              >
                {collapsed ? item.letter : active ? "▶" : "·"}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-foreground/15 font-mono text-xs">
        <div
          className={`flex items-center ${
            collapsed ? "flex-col gap-2 py-3" : "justify-between px-4 py-3"
          }`}
        >
          <WalletChip compact={collapsed} />
          <button
            onClick={toggle}
            className="hidden md:flex items-center text-foreground/55 hover:text-foreground transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "▶" : "◀"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 z-40 ${widthClass} transition-[width] duration-200`}
      >
        {sidebarContent}
      </aside>

      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-background text-foreground border border-foreground/20 rounded"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <div className="w-5 space-y-1">
          <span className="block h-px bg-current" />
          <span className="block h-px bg-current" />
          <span className="block h-px bg-current" />
        </div>
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 h-full">{sidebarContent}</div>
          <button
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </>
  );
}
