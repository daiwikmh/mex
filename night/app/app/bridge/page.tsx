import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { CrossChainView } from "@/components/mezo/CrossChainView";

export const metadata: Metadata = {
  title: "Cross-chain — Steward Console",
};

export default function BridgePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Cross-chain" title="Move capital across chains">
        Mainnet: see your BTC and stables on Ethereum and Base. Testnet: bridge MUSD
        from Mezo to Base Sepolia for real via StewardBridge.
      </PageHeader>
      <CrossChainView />
    </div>
  );
}
