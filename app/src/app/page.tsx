'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import BettingGrid to avoid SSR issues
const BettingGrid = dynamic(
  () => import('@/components/grid/BettingGrid').then((mod) => mod.BettingGrid),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[620px] bg-[#0a0a0f] border border-zinc-800 rounded-xl">
        <div className="text-zinc-500">Loading grid...</div>
      </div>
    )
  }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Flipr
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              beta
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm text-white hover:text-purple-400 transition-colors">
              Trade
            </a>
            <a href="/lp" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Provide Liquidity
            </a>
            <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Docs
            </a>
          </nav>

          <button className="px-4 py-2 rounded-lg font-medium text-sm transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-green-400 via-white to-red-400 bg-clip-text text-transparent">
                Predict the Price
              </span>
            </h1>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">
              Select a price target and time window. Win the multiplier if the price reaches your target.
            </p>
          </div>

          {/* Betting Grid - only render on client */}
          {mounted && <BettingGrid />}
          {!mounted && (
            <div className="flex items-center justify-center h-[620px] bg-[#0a0a0f] border border-zinc-800 rounded-xl">
              <div className="text-zinc-500">Loading...</div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Devnet
              </span>
              <span>|</span>
              <span>Powered by Pyth Network</span>
              <span>|</span>
              <span>Built on Solana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/5 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
