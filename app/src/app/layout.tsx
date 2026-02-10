import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flipr.lol | SOL/USD Price Prediction",
  description: "Predict SOL/USD price movements and win. Binary options on Solana with instant settlements.",
  keywords: ["Solana", "crypto", "prediction", "trading", "SOL", "USD"],
  openGraph: {
    title: "Flipr.lol | SOL/USD Price Prediction",
    description: "Predict SOL/USD price movements and win. Binary options on Solana.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flipr.lol",
    description: "Predict SOL/USD price movements and win.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
