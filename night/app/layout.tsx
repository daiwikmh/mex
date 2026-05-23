import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/lib/lenis";
import { MezoProvider } from "@/lib/mezo/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steward — AI agents that bank your Bitcoin on Mezo",
  description:
    "Borrow MUSD against BTC, fund an AI agent that settles in MEZO, and earn yield by staking the fees it pays. Built on Mezo.",
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
        <MezoProvider>
          <LenisProvider>{children}</LenisProvider>
        </MezoProvider>
      </body>
    </html>
  );
}
