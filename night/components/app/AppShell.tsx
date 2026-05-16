import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({
  children,
  active,
}: {
  children: ReactNode;
  active: "vault" | "lend";
}) {
  const tabs = [
    { href: "/app/vault", label: "Vault", key: "vault" as const },
    { href: "/app/lend", label: "Lender demo", key: "lend" as const },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent-strong shadow-[0_0_18px_2px_var(--accent-strong)]" />
            <span className="font-mono text-sm text-foreground/80">nocturne</span>
          </Link>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active === t.key
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground hover:bg-white/5"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-xs text-foreground/70 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            midnight-testnet
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">{children}</main>
    </div>
  );
}
