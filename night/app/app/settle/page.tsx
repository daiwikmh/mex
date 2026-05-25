import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { SettlePanel } from "@/components/mezo/panels";

export const metadata: Metadata = {
  title: "Settle — Mex Console",
};

export default function SettlePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Settle" title="Agent settlement in MEZO">
        Every action a Mex takes settles in MEZO on chain. Watch the receipts
        land here.
      </PageHeader>
      <SettlePanel />
    </div>
  );
}
