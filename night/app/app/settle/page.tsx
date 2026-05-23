import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { SettlePanel } from "@/components/mezo/panels";

export const metadata: Metadata = {
  title: "Settle — Steward Console",
};

export default function SettlePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Settle" title="Agent settlement in MEZO">
        Every action a Steward takes settles in MEZO on chain. Watch the receipts
        land here.
      </PageHeader>
      <SettlePanel />
    </div>
  );
}
