'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBetStore } from '@/store/betStore';
import { useState } from 'react';

const PRESETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0];

export function BetModal() {
  const { modalOpen, closeModal, selectedCell, placeBet, currentPrice } = useBetStore();
  const [selectedAmount, setSelectedAmount] = useState(0.05);
  const [customAmount, setCustomAmount] = useState('');

  if (!selectedCell) return null;

  const { targetPrice, multiplier, arrivalTime } = selectedCell;
  const timeRemaining = Math.max(0, Math.ceil((arrivalTime - Date.now()) / 1000));
  const direction = targetPrice > currentPrice ? 'UP' : targetPrice < currentPrice ? 'DOWN' : 'HOLD';
  const priceDiff = Math.abs(targetPrice - currentPrice).toFixed(2);
  
  const betAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const potentialWin = betAmount * multiplier;

  const handleBet = () => {
    if (betAmount > 0) {
      placeBet(betAmount);
    }
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              w-[380px] bg-[#0f0f14] border border-zinc-700 rounded-2xl p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold text-white">Place Your Bet</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Column arrives in <span className="text-orange-400 font-bold">{timeRemaining}s</span>
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Target info */}
            <div className={`flex items-center justify-between p-4 rounded-xl mb-5 ${
              direction === 'UP' 
                ? 'bg-green-500/10 border border-green-500/30' 
                : direction === 'DOWN'
                  ? 'bg-red-500/10 border border-red-500/30'
                  : 'bg-zinc-500/10 border border-zinc-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  direction === 'UP' 
                    ? 'bg-green-500/20 text-green-400' 
                    : direction === 'DOWN'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                }`}>
                  {direction === 'UP' ? '↑' : direction === 'DOWN' ? '↓' : '→'}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">${targetPrice.toFixed(2)}</div>
                  <div className="text-xs text-zinc-400">
                    {direction === 'UP' ? '+' : direction === 'DOWN' ? '-' : '±'}${priceDiff} from current
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  multiplier >= 3 ? 'text-yellow-400' : 
                  multiplier >= 2 ? 'text-green-400' : 
                  'text-zinc-300'
                }`}>
                  {multiplier.toFixed(2)}x
                </div>
                <div className="text-xs text-zinc-500">multiplier</div>
              </div>
            </div>

            {/* Amount presets */}
            <div className="mb-4">
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
                Bet Amount (SOL)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setSelectedAmount(preset);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                      selectedAmount === preset && !customAmount
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="mb-5">
              <input
                type="number"
                placeholder="Or enter custom amount..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3
                  text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500
                  transition-colors"
              />
            </div>

            {/* Summary */}
            <div className="bg-zinc-900/70 rounded-xl p-4 mb-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Your Bet</span>
                <span className="text-white font-medium">{betAmount || 0} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Multiplier</span>
                <span className={`font-bold ${
                  multiplier >= 3 ? 'text-yellow-400' : 
                  multiplier >= 2 ? 'text-green-400' : 
                  'text-zinc-300'
                }`}>
                  {multiplier.toFixed(2)}x
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex justify-between">
                <span className="text-zinc-400">Potential Win</span>
                <span className="text-xl font-bold text-green-400">
                  {potentialWin.toFixed(4)} SOL
                </span>
              </div>
            </div>

            {/* Place bet button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBet}
              disabled={!betAmount || betAmount <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all
                disabled:opacity-50 disabled:cursor-not-allowed ${
                direction === 'UP'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg shadow-green-500/30'
                  : direction === 'DOWN'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/30'
              }`}
            >
              {direction === 'UP' ? '🚀 Bet UP' : direction === 'DOWN' ? '📉 Bet DOWN' : '➡️ Place Bet'}
            </motion.button>

            {/* Risk warning */}
            <p className="text-center text-[10px] text-zinc-600 mt-3">
              You can lose your entire bet. Only bet what you can afford to lose.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
