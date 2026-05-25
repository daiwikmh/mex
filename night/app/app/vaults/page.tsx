import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { VaultsPanel } from "@/components/mezo/VaultsPanel";

export const metadata: Metadata = {
  title: "Vaults — Mex Console",
};

export default function VaultsPage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Vaults" title="Yield on Base Sepolia">
        Live APRs and your positions in real Aave v3 markets — deposit and withdraw
        on chain. Where idle MUSD goes to work.
      </PageHeader>
      <VaultsPanel />
    </div>
  );
}
