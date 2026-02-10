'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBetStore } from '@/store/betStore';
import { useState } from 'react';

const PRESETS = [0.01, 0.05, 0.1, 0.25];

export function BetModal() {
  const { modalOpen, closeModal, selectedCell, placeBet, currentPrice } = useBetStore();
  const [amount, setAmount] = useState(0.05);
  const [customAmount, setCustomAmount] = useState('');

  if (!selectedCell) return null;

  const priceDiff = Math.abs(selectedCell.price - currentPrice);
  const pricePercent = (priceDiff / currentPrice) * 100;
  const baseMultiplier = 1 + (pricePercent * 2);
  const timeFactor = Math.max(0.8, 1.5 - (selectedCell.timeWindow / 60));
  const multiplier = Math.min(10, Math.max(1.05, baseMultiplier * timeFactor));
  
  const potentialWin = amount * multiplier;
  const direction = selectedCell.price > currentPrice ? 'UP' : 'DOWN';

  const handleBet = () => {
    const betAmount = customAmount ? parseFloat(customAmount) : amount;
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              w-[340px] bg-[#0f0f14] border border-zinc-800 rounded-2xl p-5 shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Place Bet</h3>
                <p className="text-sm text-zinc-500">
                  Target: ${selectedCell.price.toFixed(2)} • {selectedCell.timeWindow}s window
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Direction Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${
              direction === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <span className="text-lg">{direction === 'UP' ? '↑' : '↓'}</span>
              <span className="text-sm font-medium">
                Price goes {direction} to ${selectedCell.price.toFixed(2)}
              </span>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`py-2 rounded-lg font-medium text-sm transition-all ${
                    amount === preset && !customAmount
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {preset} SOL
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mb-4">
              <input
                type="number"
                placeholder="Custom amount..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5
                  text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500
                  transition-colors"
              />
            </div>

            {/* Stats */}
            <div className="bg-zinc-900/50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Multiplier</span>
                <span className={`font-bold ${
                  multiplier >= 2.5 ? 'text-yellow-400' : 
                  multiplier >= 1.5 ? 'text-green-400' : 
                  'text-zinc-300'
                }`}>
                  {multiplier.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Bet Amount</span>
                <span className="text-white font-medium">
                  {customAmount || amount} SOL
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-zinc-800 pt-2 mt-2">
                <span className="text-zinc-500">Potential Win</span>
                <span className="text-green-400 font-bold">
                  {((customAmount ? parseFloat(customAmount) : amount) * multiplier).toFixed(4)} SOL
                </span>
              </div>
            </div>

            {/* Place bet button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBet}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                direction === 'UP'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
              }`}
            >
              Place {direction} Bet
            </motion.button>

            {/* Time indicator */}
            <p className="text-center text-xs text-zinc-500 mt-3">
              Bet resolves in {selectedCell.timeWindow} seconds
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
