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
import { WalletButton } from "@/components/mezo/WalletButton";

interface NavItem {
  href: string;
  label: string;
  letter: string;
  soon?: boolean;
}

const NAV: NavItem[] = [
  { href: "/app", label: "Overview", letter: "O" },
  { href: "/app/borrow", label: "Borrow", letter: "B" },
  { href: "/app/delegate", label: "Delegate", letter: "D", soon: true },
  { href: "/app/settle", label: "Settle", letter: "S", soon: true },
  { href: "/app/earn", label: "Earn", letter: "E", soon: true },
];

const STORAGE_KEY = "Steward:sidebar-collapsed";

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

// Longest-prefix match so /app/borrow doesn't also light up /app.
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
    <div className="flex h-full flex-col border-r border-foreground/15 bg-background text-foreground">
      <div
        className={`flex items-center border-b border-foreground/15 px-4 py-3 ${
          collapsed ? "justify-center" : "justify-start"
        }`}
      >
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5" title="Home">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-foreground" />
          {!collapsed && <span className="font-serif text-lg text-foreground">Steward</span>}
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
              className={`group flex items-center gap-3 border-l-2 px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                active
                  ? "border-foreground bg-surface text-foreground"
                  : "border-transparent text-foreground/55 hover:bg-surface/60 hover:text-foreground"
              }`}
            >
              <span
                className={`w-3 shrink-0 text-center ${
                  active ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/80"
                }`}
              >
                {collapsed ? item.letter : active ? "▶" : "·"}
              </span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.soon && (
                <span className="rounded-full bg-foreground/8 px-1.5 py-0.5 text-[9px] tracking-wider text-foreground/45">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-foreground/15">
        {!collapsed ? (
          <div className="px-4 py-3">
            <WalletButton />
          </div>
        ) : (
          <div className="flex justify-center py-3 text-foreground/35" title="Expand to connect">
            <span className="inline-block h-2 w-2 rounded-full bg-foreground/25" />
          </div>
        )}
        <div
          className={`flex items-center border-t border-foreground/15 ${
            collapsed ? "justify-center py-2" : "justify-end px-4 py-2"
          }`}
        >
          <button
            onClick={toggle}
            className="hidden items-center font-mono text-xs text-foreground/45 transition-colors hover:text-foreground md:flex"
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
      <aside className={`fixed inset-y-0 left-0 z-40 hidden md:flex ${widthClass} transition-[width] duration-200`}>
        {sidebarContent}
      </aside>

      <button
        className="fixed left-3 top-3 z-50 rounded border border-foreground/20 bg-background p-2 text-foreground md:hidden"
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
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="h-full w-60">{sidebarContent}</div>
          <button className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
        </div>
      )}
    </>
  );
}
