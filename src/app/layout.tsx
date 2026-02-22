import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { TopNav, BottomNav } from "@/components/dashboard/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Factor Lens — Multi-Factor Stock Intelligence | Indian Equities",
  description:
    "Multi-Factor Investing India | Rank, filter, and backtest Indian stocks using a data-driven multi-factor model with backtested performance vs Nifty 50.",
  keywords: [
    "indian stock market", "factor investing", "multi-factor model", "nse", "bse",
    "stock screening", "backtesting", "quant investing", "value investing india",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <TopNav />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 pb-24 md:pb-6">
          {children}
        </main>
        <BottomNav />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
