import { AppShell } from "@/components/app/AppShell";
import { VaultPortal } from "@/components/app/VaultPortal";

export const metadata = {
  title: "Vault — Nocturne",
};

export default function VaultPage() {
  return (
    <AppShell active="vault">
      <VaultPortal />
    </AppShell>
  );
}
