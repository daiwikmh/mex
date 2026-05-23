import type { Metadata } from "next";
import { PageHeader } from "@/app/app/page";
import { DelegatePanel } from "@/components/mezo/panels";

export const metadata: Metadata = {
  title: "Delegate — Steward Console",
};

export default function DelegatePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="Delegate" title="Fund a Steward agent">
        Hand MUSD to a scoped agent that acts inside a budget and a per-action
        ceiling you set.
      </PageHeader>
      <DelegatePanel />
    </div>
  );
}
