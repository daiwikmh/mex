import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/mezo/AppShell";

export const metadata: Metadata = {
  title: "Steward Console — Mezo",
  description: "Balances, borrowing and the Steward loop on Mezo.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
