'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/WalletButton';

export default function LPPage() {
  const { connected } = useWallet();
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Flipr
            </a>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              beta
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Trade
            </a>
            <a href="/lp" className="text-sm text-white hover:text-purple-400 transition-colors">
              Provide Liquidity
            </a>
            <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Docs
            </a>
          </nav>

          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Liquidity Vault
              </span>
            </h1>
            <p className="text-zinc-400 text-lg">
              Provide liquidity to the betting pool and earn fees from every bet.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">--</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">TVL</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-500">--%</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">APY</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">--</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Your Share</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">--</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Earned</div>
            </div>
          </div>

          {/* Deposit/Withdraw Panel */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deposit */}
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Deposit SOL
                </label>
                <div className="mt-2 relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl
                      text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    SOL
                  </span>
                </div>
                <button
                  disabled={!connected || !depositAmount}
                  className="w-full mt-3 py-3 rounded-xl font-bold transition-all
                    bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                >
                  Deposit
                </button>
              </div>

              {/* Withdraw */}
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Withdraw SOL
                </label>
                <div className="mt-2 relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl
                      text-white placeholder-zinc-500 focus:outline-none focus:border-red-500
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    SOL
                  </span>
                </div>
                <button
                  disabled={!connected || !withdrawAmount}
                  className="w-full mt-3 py-3 rounded-xl font-bold transition-all
                    bg-zinc-700 hover:bg-zinc-600 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {!connected && (
              <p className="text-center text-zinc-500 text-sm mt-6">
                Connect your wallet to provide liquidity
              </p>
            )}
          </div>

          {/* How it works */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">How it Works</h2>
            <div className="space-y-4 text-zinc-400">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <div className="font-medium text-white">Deposit SOL</div>
                  <div className="text-sm">Add SOL to the liquidity pool to back bets.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <div className="font-medium text-white">Earn Fees</div>
                  <div className="text-sm">Collect 2% fees from every bet placed on the platform.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <div className="font-medium text-white">Withdraw Anytime</div>
                  <div className="text-sm">No lockups. Withdraw your SOL plus earned fees at any time.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-xl">⚠️</div>
              <div className="text-sm text-red-200/80">
                <strong className="text-red-300">Risk Warning:</strong> Providing liquidity involves risk. 
                If bettors win more than they lose, the pool value decreases. Only deposit what you can afford to lose.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/5 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
