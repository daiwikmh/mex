import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { BorrowPanel } from "@/components/mezo/panels";

export const metadata: Metadata = {
  title: "Borrow — Steward Console",
};

export default function BorrowPage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Borrow" title="Mint MUSD against BTC">
        Deposit Bitcoin as collateral and draw MUSD. Keep your BTC, unlock its
        spending power.
      </PageHeader>
      <BorrowPanel />
    </div>
  );
}
