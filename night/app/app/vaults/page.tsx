import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { VaultsPanel } from "@/components/mezo/VaultsPanel";

export const metadata: Metadata = {
  title: "Vaults — Steward Console",
};

export default function VaultsPage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Vaults" title="Yield across chains">
        Live APYs and your positions in Aave v3 vaults on Ethereum and Base. The
        venues a Steward agent could put idle MUSD to work in.
      </PageHeader>
      <VaultsPanel />
    </div>
  );
}
