'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PriceRow } from './PriceRow';
import { PriceLine } from './PriceLine';
import { BetModal } from './BetModal';
import { Confetti } from './Confetti';
import { useBetStore } from '@/store/betStore';

// Time windows in seconds
const TIME_WINDOWS = [5, 10, 15, 30, 45, 60];

// Generate price levels around current price
function generatePriceLevels(currentPrice: number, count: number = 11): number[] {
  const step = 0.05; // $0.05 increments
  const halfCount = Math.floor(count / 2);
  const levels: number[] = [];
  
  for (let i = halfCount; i >= -halfCount; i--) {
    levels.push(parseFloat((currentPrice + (i * step)).toFixed(2)));
  }
  
  return levels;
}

export function BettingGrid() {
  const { currentPrice, setCurrentPrice, bets } = useBetStore();
  const [priceLevels, setPriceLevels] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(0);

  // Initialize price levels
  useEffect(() => {
    setPriceLevels(generatePriceLevels(currentPrice));
  }, []);

  // Measure grid height for price line positioning
  useEffect(() => {
    if (gridRef.current) {
      setGridHeight(gridRef.current.offsetHeight);
    }
  }, [priceLevels]);

  // Simulate price movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(currentPrice + (Math.random() - 0.5) * 0.02);
    }, 500);
    
    return () => clearInterval(interval);
  }, [currentPrice, setCurrentPrice]);

  // Update price levels when price drifts too far
  useEffect(() => {
    if (priceLevels.length > 0) {
      const minLevel = Math.min(...priceLevels);
      const maxLevel = Math.max(...priceLevels);
      
      if (currentPrice < minLevel + 0.1 || currentPrice > maxLevel - 0.1) {
        setPriceLevels(generatePriceLevels(currentPrice));
      }
    }
  }, [currentPrice, priceLevels]);

  const priceRange = priceLevels.length > 0 
    ? { min: Math.min(...priceLevels), max: Math.max(...priceLevels) }
    : { min: currentPrice - 0.25, max: currentPrice + 0.25 };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Grid Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">SOL/USD</h2>
          <p className="text-sm text-zinc-500">Select a price target and time window</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-zinc-500">Current Price</div>
            <motion.div
              key={currentPrice.toFixed(2)}
              initial={{ scale: 1.1, color: '#fff' }}
              animate={{ scale: 1, color: '#a1a1aa' }}
              className="text-2xl font-mono font-bold"
            >
              ${currentPrice.toFixed(4)}
            </motion.div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* Time Headers */}
      <div className="flex ml-20 mb-2 gap-1">
        {TIME_WINDOWS.map((tw) => (
          <div
            key={tw}
            className="min-w-[80px] text-center text-xs text-zinc-500 font-medium"
          >
            {tw}s
          </div>
        ))}
      </div>

      {/* Grid Container */}
      <div className="relative bg-[#0a0a0f] border border-zinc-800 rounded-xl p-4 overflow-hidden">
        {/* Price Line */}
        <PriceLine
          currentPrice={currentPrice}
          priceRange={priceRange}
          gridHeight={gridHeight}
        />

        {/* Grid Rows */}
        <div ref={gridRef} className="relative space-y-1">
          {priceLevels.map((price) => (
            <PriceRow
              key={price}
              price={price}
              timeWindows={TIME_WINDOWS}
              currentPrice={currentPrice}
              bets={bets}
            />
          ))}
        </div>

        {/* Grid overlay glow effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-purple-500/5 via-transparent to-pink-500/5" />
      </div>

      {/* Active Bets Summary */}
      {bets.filter((b) => b.status === 'active').length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
        >
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Active Bets ({bets.filter((b) => b.status === 'active').length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {bets
              .filter((b) => b.status === 'active')
              .map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-2"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs">
                    {bet.targetPrice > bet.entryPrice ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      ${bet.targetPrice.toFixed(2)} @ {bet.multiplier}x
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {bet.amount} SOL • {bet.timeWindow}s
                    </div>
                  </div>
                  <CountdownTimer expiresAt={bet.expiresAt} />
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Bet Modal */}
      <BetModal />

      {/* Confetti Effect */}
      <Confetti />

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500/50 border border-orange-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500" />
          <span>Won</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
          <span>Lost</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-red-500" />
          <span>Current Price</span>
        </div>
      </div>
    </div>
  );
}

// Countdown timer component
function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 100);
    
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={`text-xs font-mono font-bold ${
      timeLeft <= 5 ? 'text-red-400' : 'text-orange-400'
    }`}>
      {timeLeft}s
    </div>
  );
}
