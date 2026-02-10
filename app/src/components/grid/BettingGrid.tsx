'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';

const ROW_HEIGHT = 56;
const COLUMN_WIDTH = 85;
const VISIBLE_ROWS = 11;
const VISIBLE_COLUMNS = 12;
const PRICE_STEP = 0.01;
const SCROLL_SPEED = 25; // pixels per second
const BET_AMOUNT = 0.01;

// Pyth SOL/USD price feed ID
const SOL_USD_FEED_ID = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

interface Bet {
  id: string;
  price: number;
  columnIndex: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: number;
}

interface PricePoint {
  price: number;
  time: number;
}

// Calculate multiplier based on distance from current price AND column (time)
function getMultiplier(priceDistance: number, columnIndex: number): number {
  let baseMult: number;
  if (priceDistance === 0) {
    baseMult = 1.05;
  } else if (priceDistance === 1) {
    baseMult = 1.30;
  } else if (priceDistance === 2) {
    baseMult = 2.70;
  } else {
    baseMult = 3.00;
  }
  
  // Time bonus for further columns
  const timeBonus = 1 + (columnIndex * 0.02);
  return Number((baseMult * timeBonus).toFixed(2));
}

export function BettingGrid() {
  const [currentPrice, setCurrentPrice] = useState<number>(195.50); // Default fallback
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [mounted, setMounted] = useState(false);
  const animationRef = useRef<number>();

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch price from Pyth
  useEffect(() => {
    if (!mounted) return;

    const fetchPrice = async () => {
      try {
        const hermes = new HermesClient('https://hermes.pyth.network');
        const updates = await hermes.getLatestPriceUpdates([SOL_USD_FEED_ID]);
        if (updates.parsed?.[0]) {
          const priceData = updates.parsed[0].price;
          const price = Number(priceData.price) * Math.pow(10, priceData.expo);
          setCurrentPrice(price);
          setPriceHistory(h => [...h.slice(-80), { price, time: Date.now() }]);
        }
      } catch (e) {
        console.error('Pyth error:', e);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 500);
    return () => clearInterval(interval);
  }, [mounted]);

  // Scroll animation
  useEffect(() => {
    if (!mounted) return;

    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      setScrollOffset(prev => (prev + SCROLL_SPEED * delta) % COLUMN_WIDTH);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mounted]);

  // Generate price rows centered on current price
  const priceRows = useMemo(() => {
    const centerPrice = Math.round(currentPrice / PRICE_STEP) * PRICE_STEP;
    const rows: number[] = [];
    const halfRows = Math.floor(VISIBLE_ROWS / 2);
    for (let i = halfRows; i >= -halfRows; i--) {
      rows.push(Number((centerPrice + i * PRICE_STEP).toFixed(2)));
    }
    return rows;
  }, [currentPrice]);

  const placeBet = useCallback((price: number, columnIndex: number, multiplier: number) => {
    setBets(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      price,
      columnIndex,
      multiplier,
      status: 'pending',
      createdAt: Date.now(),
    }]);
  }, []);

  const getBetForCell = (price: number, colIdx: number) => {
    return bets.find(b => Math.abs(b.price - price) < 0.005 && b.columnIndex === colIdx);
  };

  // Price Y position for the chart
  const getPriceY = (price: number): number => {
    if (priceRows.length === 0) return (VISIBLE_ROWS * ROW_HEIGHT) / 2;
    const maxPrice = priceRows[0];
    const minPrice = priceRows[priceRows.length - 1];
    const range = maxPrice - minPrice;
    if (range === 0) return (VISIBLE_ROWS * ROW_HEIGHT) / 2;
    return ((maxPrice - price) / range) * (VISIBLE_ROWS * ROW_HEIGHT);
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[#faf9f7] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const priceY = getPriceY(currentPrice);
  const gridHeight = VISIBLE_ROWS * ROW_HEIGHT;

  return (
    <div className="fixed inset-0 bg-[#faf9f7] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💜</span>
          <span className="font-bold text-gray-900 text-xl">Flipr</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">beta</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">SOL/USD</div>
            <div className="text-xl font-bold text-red-500">${currentPrice.toFixed(2)}</div>
          </div>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Price Labels */}
        <div className="w-16 shrink-0 flex flex-col bg-[#faf9f7] z-20">
          {priceRows.map((price, idx) => {
            const isCurrentRow = idx === Math.floor(VISIBLE_ROWS / 2);
            return (
              <div
                key={price}
                style={{ height: ROW_HEIGHT }}
                className={`flex items-center justify-end pr-2 text-xs font-mono ${
                  isCurrentRow ? 'text-red-500 font-bold' : 'text-gray-400'
                }`}
              >
                ${price.toFixed(2)}
              </div>
            );
          })}
        </div>

        {/* Price Chart Area */}
        <div className="w-80 shrink-0 relative bg-[#faf9f7] border-r border-gray-200">
          <svg className="absolute inset-0 w-full" style={{ height: gridHeight }}>
            {/* Price trail line */}
            {priceHistory.length > 1 && (
              <path
                d={priceHistory.map((p, i, arr) => {
                  const x = (i / Math.max(arr.length - 1, 1)) * 320;
                  const y = getPriceY(p.price);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.7"
              />
            )}
          </svg>
          {/* Current price dot */}
          <div
            className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md z-10"
            style={{ right: -6, top: priceY - 6 }}
          />
          {/* Horizontal line extending to grid */}
          <div
            className="absolute right-0 w-8 h-0.5 bg-red-400/50"
            style={{ top: priceY - 1 }}
          />
        </div>

        {/* Betting Grid */}
        <div className="flex-1 overflow-hidden relative">
          {/* Horizontal price indicator line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-300/40 z-10 pointer-events-none"
            style={{ top: priceY }}
          />
          
          {/* Scrolling grid */}
          <div
            className="absolute inset-0"
            style={{ transform: `translateX(${-scrollOffset}px)` }}
          >
            {priceRows.map((price, rowIdx) => {
              const priceDistance = Math.abs(rowIdx - Math.floor(VISIBLE_ROWS / 2));
              const isCurrentRow = priceDistance === 0;

              return (
                <div
                  key={price}
                  className={`flex ${isCurrentRow ? 'bg-red-50/50' : ''}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {Array.from({ length: VISIBLE_COLUMNS + 2 }).map((_, colIdx) => {
                    const multiplier = getMultiplier(priceDistance, colIdx);
                    const bet = getBetForCell(price, colIdx);

                    let bgClass = 'hover:bg-gray-100';
                    let textClass = 'text-gray-500';

                    if (bet) {
                      if (bet.status === 'pending') {
                        bgClass = 'bg-orange-100 border-orange-300';
                        textClass = 'text-orange-600';
                      } else if (bet.status === 'won') {
                        bgClass = 'bg-green-100 border-green-400';
                        textClass = 'text-green-600';
                      } else {
                        bgClass = 'bg-red-100 border-red-300';
                        textClass = 'text-red-500';
                      }
                    }

                    return (
                      <button
                        key={colIdx}
                        onClick={() => !bet && placeBet(price, colIdx, multiplier)}
                        disabled={!!bet}
                        className={`shrink-0 flex flex-col items-center justify-center border-r border-b border-gray-200/60 transition-colors ${bgClass}`}
                        style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                      >
                        <span className={`text-sm font-semibold ${textClass}`}>
                          {multiplier}x
                        </span>
                        <span className={`text-[10px] opacity-60 ${textClass}`}>
                          ${price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bet Amount Selector */}
      <div className="h-24 bg-white border-t border-gray-200 flex items-center justify-center shrink-0 z-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-xs text-gray-500 text-center font-medium mb-1">BET AMOUNT (SOL)</div>
          <div className="text-2xl font-bold text-center text-gray-900 mb-2">{BET_AMOUNT}</div>
          <div className="flex gap-2">
            {[0.01, 0.05, 0.1, 0.25].map(amt => (
              <button
                key={amt}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  amt === BET_AMOUNT
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-6 bg-[#faf9f7] flex items-center justify-center text-xs text-gray-400 shrink-0">
        powered by{' '}
        <a href="https://magicblock.gg" className="text-purple-500 ml-1 hover:underline">
          MagicBlock
        </a>
      </div>
    </div>
  );
}
