import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "SignalForge",
  description:
    "SignalForge is a polished quant signal platform for transparent scoring, ranked signals, strategy explanations, and backtesting metrics."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="font-[var(--font-body)]">{children}</body>
    </html>
  );
}
