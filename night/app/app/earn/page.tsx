"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { ContributorPanel } from "@/components/app/ContributorPanel";
import { readVault, type VaultState } from "@/lib/store";

export default function EarnPage() {
  const [vault, setVault] = useState<VaultState | null>(null);

  useEffect(() => {
    setVault(readVault());
    const onChange = () => setVault(readVault());
    window.addEventListener("nocturne:vault-change", onChange);
    return () => window.removeEventListener("nocturne:vault-change", onChange);
  }, []);

  return (
    <AppShell>
      <header className="mb-8 flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-widest text-foreground/50">
          Contributor portal
        </div>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Earn royalties.{" "}
          <span className="text-foreground/55">Privately.</span>
        </h1>
        <p className="max-w-2xl text-foreground/70">
          Every underwriting that pulls cohort signal from your vault pays you a
          private royalty. Distributed via Midnight&rsquo;s shielded payment
          primitive. You set the policy.
        </p>
      </header>
      <ContributorPanel vault={vault} />
    </AppShell>
  );
}
