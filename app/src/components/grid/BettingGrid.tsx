'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';

const ROW_HEIGHT = 52;
const COLUMN_WIDTH = 80;
const VISIBLE_ROWS = 15;
const PRICE_STEP = 0.01;
const TOTAL_COLUMNS = 14;
const BET_AMOUNT = 0.01;

// Pyth SOL/USD price feed ID
const SOL_USD_FEED_ID = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// Multipliers by column (time-based, like risk.lol)
const COLUMN_MULTIPLIERS = [3.5, 3, 2, 1.7, 1.4, 1.5, 1.4, 1.4, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3];

interface Bet {
  id: string;
  price: number;
  column: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: number;
}

interface PricePoint {
  price: number;
  time: number;
}

export function BettingGrid() {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [mounted, setMounted] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const hermesRef = useRef<HermesClient | null>(null);

  // Initialize Pyth Hermes client
  useEffect(() => {
    setMounted(true);
    
    const initPyth = async () => {
      try {
        const hermes = new HermesClient('https://hermes.pyth.network');
        hermesRef.current = hermes;
        
        // Get initial price
        const priceUpdates = await hermes.getLatestPriceUpdates([SOL_USD_FEED_ID]);
        if (priceUpdates.parsed?.[0]) {
          const priceData = priceUpdates.parsed[0].price;
          const price = Number(priceData.price) * Math.pow(10, priceData.expo);
          setCurrentPrice(price);
          setPriceHistory([{ price, time: Date.now() }]);
        }
        
        // Subscribe to price updates via polling (Hermes doesn't have native WS in browser)
        const pollPrices = async () => {
          try {
            const updates = await hermes.getLatestPriceUpdates([SOL_USD_FEED_ID]);
            if (updates.parsed?.[0]) {
              const priceData = updates.parsed[0].price;
              const price = Number(priceData.price) * Math.pow(10, priceData.expo);
              setCurrentPrice(price);
              setPriceHistory(h => {
                const newHistory = [...h, { price, time: Date.now() }];
                return newHistory.slice(-100); // Keep last 100 points
              });
            }
          } catch (e) {
            console.error('Price poll error:', e);
          }
        };
        
        // Poll every 500ms for smooth updates
        const interval = setInterval(pollPrices, 500);
        return () => clearInterval(interval);
      } catch (e) {
        console.error('Pyth init error:', e);
        // Fallback to simulated price if Pyth fails
        setCurrentPrice(195.50);
      }
    };
    
    initPyth();
  }, []);

  const placeBet = useCallback((price: number, column: number, multiplier: number) => {
    const newBet: Bet = {
      id: `${Date.now()}-${Math.random()}`,
      price,
      column,
      multiplier,
      status: 'pending',
      createdAt: Date.now(),
    };
    setBets(prev => [...prev, newBet]);
  }, []);

  // Generate price rows centered on current price
  const getPriceRows = () => {
    if (!currentPrice) return [];
    const centerPrice = Math.round(currentPrice / PRICE_STEP) * PRICE_STEP;
    const rows: number[] = [];
    const halfRows = Math.floor(VISIBLE_ROWS / 2);
    for (let i = halfRows; i >= -halfRows; i--) {
      rows.push(Number((centerPrice + i * PRICE_STEP).toFixed(2)));
    }
    return rows;
  };

  const priceRows = getPriceRows();

  const getBetForCell = (price: number, colIdx: number) => {
    return bets.find(b => Math.abs(b.price - price) < 0.005 && b.column === colIdx && b.status === 'pending');
  };

  // Calculate price line Y position
  const getPriceY = (price: number) => {
    if (priceRows.length === 0) return VISIBLE_ROWS * ROW_HEIGHT / 2;
    const maxPrice = Math.max(...priceRows);
    const minPrice = Math.min(...priceRows);
    const range = maxPrice - minPrice;
    if (range === 0) return VISIBLE_ROWS * ROW_HEIGHT / 2;
    return ((maxPrice - price) / range) * (VISIBLE_ROWS * ROW_HEIGHT);
  };

  // Determine if a price row is "at" current price
  const isCurrentPriceRow = (rowPrice: number) => {
    if (!currentPrice) return false;
    return Math.abs(rowPrice - currentPrice) < PRICE_STEP / 2;
  };

  if (!mounted || currentPrice === null) {
    return (
      <div className="fixed inset-0 bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading SOL/USD price...</div>
      </div>
    );
  }

  const currentY = getPriceY(currentPrice);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-12 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-xl">💜</span>
          <span className="font-bold text-white">Flipr</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">beta</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-500">SOL/USD</div>
            <div className="text-lg font-bold text-green-400">${currentPrice.toFixed(2)}</div>
          </div>
          <button className="px-3 py-1.5 bg-red-500 text-white text-sm rounded font-medium hover:bg-red-600">
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div ref={gridRef} className="flex-1 flex relative">
        {/* Price labels on left */}
        <div className="w-14 bg-[#1a1a1a] z-30 flex flex-col">
          {priceRows.map(price => (
            <div 
              key={price} 
              className={`flex items-center justify-end pr-2 text-[11px] font-mono ${
                isCurrentPriceRow(price) ? 'text-green-400 font-bold' : 'text-gray-500'
              }`}
              style={{ height: ROW_HEIGHT }}
            >
              ${price.toFixed(2)}
            </div>
          ))}
        </div>

        {/* Price chart area */}
        <div className="w-24 relative bg-[#1a1a1a] border-r border-gray-800">
          <svg className="absolute inset-0 w-full h-full">
            {/* Price trail */}
            {priceHistory.length > 1 && (
              <path
                d={priceHistory.slice(-50).map((p, i, arr) => {
                  const x = (i / (arr.length - 1)) * 96;
                  const y = getPriceY(p.price);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(239, 68, 68, 0.8)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Current price dot */}
            <circle
              cx={96}
              cy={currentY}
              r="5"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Grid cells */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col">
            {priceRows.map((price, rowIdx) => (
              <div 
                key={price} 
                className="flex border-b border-gray-800/50"
                style={{ height: ROW_HEIGHT }}
              >
                {Array.from({ length: TOTAL_COLUMNS }).map((_, colIdx) => {
                  const multiplier = COLUMN_MULTIPLIERS[colIdx] || 1.3;
                  const bet = getBetForCell(price, colIdx);
                  const isNearPrice = Math.abs(price - currentPrice) < PRICE_STEP * 1.5;
                  
                  let bgClass = 'bg-transparent hover:bg-gray-800/50';
                  let textClass = 'text-gray-400';
                  
                  if (bet) {
                    bgClass = 'bg-orange-500/30 border-orange-500';
                    textClass = 'text-orange-300';
                  }
                  
                  return (
                    <button
                      key={colIdx}
                      onClick={() => !bet && placeBet(price, colIdx, multiplier)}
                      disabled={!!bet}
                      className={`flex flex-col items-center justify-center border-r border-gray-800/30 transition-colors ${bgClass}`}
                      style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                    >
                      <span className={`text-sm font-semibold ${textClass}`}>{multiplier}x</span>
                      <span className={`text-[10px] ${textClass} opacity-60`}>${price.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal price line indicator */}
        <div 
          className="absolute left-14 right-0 h-[2px] bg-green-500/50 pointer-events-none z-20"
          style={{ top: currentY }}
        />
      </div>

      {/* Bet amount selector */}
      <div className="h-24 bg-[#222] border-t border-gray-800 flex items-center justify-center z-50">
        <div className="bg-[#2a2a2a] rounded-lg p-3 shadow-xl">
          <div className="text-[10px] text-gray-500 mb-1 text-center">BET AMOUNT (SOL)</div>
          <div className="text-xl font-bold text-center text-white mb-2">{BET_AMOUNT}</div>
          <div className="flex gap-1">
            {[0.01, 0.05, 0.1, 0.25].map(amt => (
              <button
                key={amt}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  amt === BET_AMOUNT 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-6 bg-[#1a1a1a] border-t border-gray-800 flex items-center justify-center text-[10px] text-gray-600">
        powered by <a href="https://magicblock.gg" className="text-purple-400 ml-1 hover:underline">MagicBlock</a>
      </div>
    </div>
  );
}
