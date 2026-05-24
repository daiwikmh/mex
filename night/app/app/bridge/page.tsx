import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { CrossChainPanel } from "@/components/mezo/CrossChainPanel";

export const metadata: Metadata = {
  title: "Cross-chain — Steward Console",
};

export default function BridgePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Cross-chain" title="Bring your assets to Mezo">
        Hold BTC or stablecoins on Ethereum or Base? Steward sees them here. Bridge
        them to Mezo to borrow MUSD and fund a Steward agent.
      </PageHeader>
      <CrossChainPanel />
    </div>
  );
}
