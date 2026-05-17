import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/lib/lenis";
import { WalletProvider } from "@/lib/midnight/wallet";
import { MidnightRuntimeProvider } from "@/lib/midnight/runtime";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Omnis — Revocable Delegated AI Agents on Midnight",
  description:
    "A scoped AI agent that runs in a TEE under a policy you signed on Midnight. Every query logged on chain. Revoke any time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <WalletProvider>
          <MidnightRuntimeProvider>
            <LenisProvider>{children}</LenisProvider>
          </MidnightRuntimeProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
