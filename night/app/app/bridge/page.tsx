import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { BridgePanel } from "@/components/mezo/BridgePanel";

export const metadata: Metadata = {
  title: "Cross-chain — Mex Console",
};

export default function BridgePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Cross-chain" title="Bridge MUSD to Base Sepolia">
        Lock MUSD on Mezo and mint it on Base Sepolia for real, then put it to work
        in a testnet vault.
      </PageHeader>
      <BridgePanel />
    </div>
  );
}
