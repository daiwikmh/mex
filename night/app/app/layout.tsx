import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/mezo/AppShell";

export const metadata: Metadata = {
  title: "Mex Console — Mezo",
  description: "Balances, borrowing and the Mex loop on Mezo.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
