'use client';

import { useState, useEffect } from 'react';

const ROW_HEIGHT = 75;
const COLUMN_WIDTH = 90;
const VISIBLE_ROWS = 8;
const VISIBLE_COLUMNS = 10;
const PRICE_STEP = 0.10;
const BASE_PRICE = 135.50;

export function BettingGrid() {
  const [currentPrice, setCurrentPrice] = useState(BASE_PRICE);
  const [scrollX, setScrollX] = useState(0);

  // Price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const drift = (Math.random() - 0.5) * 0.05;
        return prev + drift;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Scroll animation
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      setScrollX(prev => (prev + delta * 0.03) % (COLUMN_WIDTH * 3));
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Generate price rows centered around current price
  const priceRows = [];
  const centerPrice = Math.round(currentPrice / PRICE_STEP) * PRICE_STEP;
  for (let i = Math.floor(VISIBLE_ROWS / 2); i >= -Math.floor(VISIBLE_ROWS / 2) + 1; i--) {
    priceRows.push(centerPrice + i * PRICE_STEP);
  }

  const gridHeight = VISIBLE_ROWS * ROW_HEIGHT;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">SOL/USD Grid</h2>
          <p className="text-sm text-zinc-500">Click cells to place bets</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-500">Live Price</div>
          <div className="text-2xl font-mono font-bold text-white">
            ${currentPrice.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Time labels */}
      <div className="flex mb-2 text-xs text-zinc-500" style={{ paddingLeft: 140 }}>
        {Array.from({ length: VISIBLE_COLUMNS }).map((_, i) => (
          <div key={i} className="text-center" style={{ width: COLUMN_WIDTH }}>
            {i * 3}s
          </div>
        ))}
      </div>

      {/* Grid */}
      <div 
        className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden"
        style={{ height: gridHeight + 20 }}
      >
        {/* Price line */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-[130px] flex items-center justify-end pr-2 border-r-2 border-red-500 z-10"
          style={{ background: 'linear-gradient(to right, #0a0a0f, transparent)' }}
        >
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Scrolling grid */}
        <div 
          className="absolute top-2 bottom-2 overflow-hidden"
          style={{ left: 130, right: 10 }}
        >
          <div
            className="flex flex-col gap-1"
            style={{ transform: `translateX(${-scrollX}px)` }}
          >
            {priceRows.map((price) => (
              <div key={price.toFixed(2)} className="flex gap-1">
                {/* Price label */}
                <div 
                  className={`flex items-center justify-end pr-2 font-mono text-sm shrink-0 ${
                    Math.abs(price - currentPrice) < PRICE_STEP / 2
                      ? 'text-white font-bold'
                      : price > currentPrice 
                        ? 'text-green-400/70' 
                        : 'text-red-400/70'
                  }`}
                  style={{ width: 70 }}
                >
                  ${price.toFixed(2)}
                </div>
                
                {/* Cells */}
                {Array.from({ length: VISIBLE_COLUMNS }).map((_, colIdx) => {
                  const multiplier = colIdx <= 1 ? 5.0 : colIdx <= 3 ? 3.0 : colIdx <= 5 ? 2.0 : 1.5;
                  return (
                    <button
                      key={colIdx}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-zinc-700/50 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-600 transition-all"
                      style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT - 5 }}
                      onClick={() => alert(`Bet on $${price.toFixed(2)} @ ${multiplier}x`)}
                    >
                      <span className={`text-lg font-bold ${
                        multiplier >= 3 ? 'text-yellow-400' : 
                        multiplier >= 2 ? 'text-green-400' : 
                        'text-zinc-400'
                      }`}>
                        {multiplier.toFixed(1)}x
                      </span>
                      <span className="text-xs text-zinc-500">
                        ${price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500/30 border-2 border-orange-500" />
          <span>Your Bet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/40 border-2 border-green-400" />
          <span>Won</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border-2 border-red-500/50" />
          <span>Lost</span>
        </div>
      </div>
    </div>
  );
}
