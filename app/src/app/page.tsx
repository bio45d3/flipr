'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Flipr
          </div>
          <button className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            Connect Wallet
          </button>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">
              Predict the Price
            </h1>
            <p className="text-zinc-400">
              SOL/USD price prediction on Solana
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 mb-4">Grid UI coming soon...</p>
            <p className="text-2xl font-mono font-bold text-white">$135.50</p>
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            Powered by Pyth Network | Built on Solana
          </div>
        </div>
      </div>
    </main>
  );
}
