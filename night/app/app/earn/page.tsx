import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { EarnPanel } from "@/components/mezo/panels";

export const metadata: Metadata = {
  title: "Earn — Mex Console",
};

export default function EarnPage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Earn" title="Stake MEZO for real yield">
        Stake MEZO to earn the fees agents pay and unlock loyalty discounts.
        Yield from usage, not emissions.
      </PageHeader>
      <EarnPanel />
    </div>
  );
}
