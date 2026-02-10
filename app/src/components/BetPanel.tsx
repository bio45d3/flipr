'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BET_DURATIONS, DEFAULT_BET_AMOUNTS } from '@/lib/constants';

interface BetPanelProps {
  onBet?: (direction: 'up' | 'down', amount: number, duration: number) => void;
}

export function BetPanel({ onBet }: BetPanelProps) {
  const { connected } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number>(DEFAULT_BET_AMOUNTS[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(BET_DURATIONS[0].seconds);
  const [customAmount, setCustomAmount] = useState<string>('');

  const activeAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleBet = (direction: 'up' | 'down') => {
    if (!connected || !activeAmount || activeAmount <= 0) return;
    onBet?.(direction, activeAmount, selectedDuration);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
      {/* Duration Selection */}
      <div className="mb-6">
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Duration</label>
        <div className="flex gap-2 mt-2">
          {BET_DURATIONS.map((duration) => (
            <button
              key={duration.seconds}
              onClick={() => setSelectedDuration(duration.seconds)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedDuration === duration.seconds
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Selection */}
      <div className="mb-6">
        <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Amount (SOL)</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {DEFAULT_BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`py-2 rounded-lg text-sm font-medium transition-all
                ${selectedAmount === amount && !customAmount
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
            >
              {amount} SOL
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom amount..."
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full mt-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg
            text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Bet Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleBet('up')}
          disabled={!connected || !activeAmount}
          className="py-4 rounded-xl font-bold text-lg transition-all
            bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-green-500/20 hover:shadow-green-500/40
            flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          UP
        </button>
        <button
          onClick={() => handleBet('down')}
          disabled={!connected || !activeAmount}
          className="py-4 rounded-xl font-bold text-lg transition-all
            bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-red-500/20 hover:shadow-red-500/40
            flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          DOWN
        </button>
      </div>

      {!connected && (
        <p className="text-center text-zinc-500 text-sm mt-4">
          Connect your wallet to place bets
        </p>
      )}
    </div>
  );
}
