import { AppShell } from "@/components/app/AppShell";
import { LenderPortal } from "@/components/app/LenderPortal";

export const metadata = {
  title: "Lender demo — Nocturne",
};

export default function LendPage() {
  return (
    <AppShell active="lend">
      <LenderPortal />
    </AppShell>
  );
}
