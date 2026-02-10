'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';

const ROW_HEIGHT = 64;
const COLUMN_WIDTH = 90;
const VISIBLE_ROWS = 11;
const PRICE_STEP = 0.01;
const SCROLL_SPEED = 30; // pixels per second
const PRICE_LINE_X = 400; // Fixed X position where bets resolve
const BET_AMOUNT = 0.01;

// Pyth SOL/USD price feed ID
const SOL_USD_FEED_ID = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

interface Bet {
  id: string;
  price: number;
  columnId: number; // unique column identifier
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: number;
}

interface Column {
  id: number;
  createdAt: number;
}

interface PricePoint {
  price: number;
  time: number;
}

// Calculate multiplier based on distance from current price AND time (column position)
function getMultiplier(priceDistance: number, columnIndex: number): number {
  // Base multiplier from price distance (rows away from current)
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
  
  // Time bonus (columns further right = longer wait = higher payout)
  const timeBonus = 1 + (columnIndex * 0.03);
  
  return Number((baseMult * timeBonus).toFixed(2));
}

export function BettingGrid() {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [scrollX, setScrollX] = useState(0);
  const [columns, setColumns] = useState<Column[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [mounted, setMounted] = useState(false);
  const [nextColumnId, setNextColumnId] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const hermesRef = useRef<HermesClient | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    
    // Initialize columns
    const initialColumns: Column[] = [];
    const now = Date.now();
    for (let i = 0; i < 15; i++) {
      initialColumns.push({ id: i, createdAt: now });
    }
    setColumns(initialColumns);
    setNextColumnId(15);
  }, []);

  // Initialize Pyth price feed
  useEffect(() => {
    if (!mounted) return;
    
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
        
        // Poll for updates
        const pollPrices = async () => {
          try {
            const updates = await hermes.getLatestPriceUpdates([SOL_USD_FEED_ID]);
            if (updates.parsed?.[0]) {
              const priceData = updates.parsed[0].price;
              const price = Number(priceData.price) * Math.pow(10, priceData.expo);
              setCurrentPrice(price);
              setPriceHistory(h => [...h.slice(-100), { price, time: Date.now() }]);
            }
          } catch (e) {
            console.error('Price poll error:', e);
          }
        };
        
        const interval = setInterval(pollPrices, 400);
        return () => clearInterval(interval);
      } catch (e) {
        console.error('Pyth init error:', e);
        // Fallback
        setCurrentPrice(195.50);
        setPriceHistory([{ price: 195.50, time: Date.now() }]);
      }
    };
    
    initPyth();
  }, [mounted]);

  // Scroll animation - columns move LEFT
  useEffect(() => {
    if (!mounted) return;
    
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      setScrollX(prev => prev + (SCROLL_SPEED * delta) / 1000);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [mounted]);

  // Add new columns as they scroll off, remove old ones
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setColumns(prev => {
        // Remove columns that have scrolled past the price line
        const filtered = prev.filter((col, idx) => {
          const x = PRICE_LINE_X + idx * COLUMN_WIDTH - scrollX;
          return x > -COLUMN_WIDTH;
        });
        
        // Add new columns on the right if needed
        const rightmostX = PRICE_LINE_X + (filtered.length - 1) * COLUMN_WIDTH - scrollX;
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        
        if (rightmostX < screenWidth + COLUMN_WIDTH * 2) {
          setNextColumnId(id => {
            const newCol: Column = { id, createdAt: Date.now() };
            setColumns(c => [...c, newCol]);
            return id + 1;
          });
        }
        
        return filtered;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [mounted, scrollX]);

  // Check bet outcomes when columns reach price line
  useEffect(() => {
    if (!currentPrice || !mounted) return;
    
    const interval = setInterval(() => {
      setBets(prevBets => {
        return prevBets.map(bet => {
          if (bet.status !== 'pending') return bet;
          
          // Find column index
          const colIdx = columns.findIndex(c => c.id === bet.columnId);
          if (colIdx === -1) return { ...bet, status: 'lost' as const };
          
          // Calculate column X position
          const colX = PRICE_LINE_X + colIdx * COLUMN_WIDTH - scrollX;
          
          // If column has reached/passed the price line
          if (colX <= PRICE_LINE_X - COLUMN_WIDTH / 2) {
            // Check if bet price matches current price (within tolerance)
            const won = Math.abs(currentPrice - bet.price) < PRICE_STEP;
            return { ...bet, status: won ? 'won' as const : 'lost' as const };
          }
          
          return bet;
        }).filter(bet => {
          // Remove settled bets after 3 seconds
          if (bet.status !== 'pending') {
            return Date.now() - bet.createdAt < 5000;
          }
          return true;
        });
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentPrice, columns, scrollX, mounted]);

  const placeBet = useCallback((price: number, columnId: number, multiplier: number) => {
    const newBet: Bet = {
      id: `${Date.now()}-${Math.random()}`,
      price,
      columnId,
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

  const getBetForCell = (price: number, columnId: number) => {
    return bets.find(b => 
      Math.abs(b.price - price) < 0.005 && 
      b.columnId === columnId
    );
  };

  // Calculate price line Y position within the grid
  const getPriceY = (price: number) => {
    if (priceRows.length === 0 || !currentPrice) return VISIBLE_ROWS * ROW_HEIGHT / 2;
    const maxPrice = priceRows[0];
    const minPrice = priceRows[priceRows.length - 1];
    const range = maxPrice - minPrice;
    if (range === 0) return VISIBLE_ROWS * ROW_HEIGHT / 2;
    return ((maxPrice - price) / range) * (VISIBLE_ROWS * ROW_HEIGHT);
  };

  if (!mounted || currentPrice === null) {
    return (
      <div className="fixed inset-0 bg-[#faf9f7] flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading SOL/USD price...</div>
      </div>
    );
  }

  const priceY = getPriceY(currentPrice);

  return (
    <div className="fixed inset-0 bg-[#faf9f7] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💜</span>
          <span className="font-bold text-gray-900 text-xl">Flipr</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">beta</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">SOL/USD</div>
            <div className="text-2xl font-bold text-red-500">${currentPrice.toFixed(2)}</div>
          </div>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div ref={gridRef} className="flex-1 relative overflow-hidden">
        {/* Price labels on left */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#faf9f7] z-30 flex flex-col">
          {priceRows.map((price, idx) => {
            const isCurrentRow = Math.abs(price - currentPrice) < PRICE_STEP / 2;
            return (
              <div 
                key={price} 
                className={`flex items-center justify-end pr-3 text-xs font-mono ${
                  isCurrentRow ? 'text-red-500 font-bold' : 'text-gray-400'
                }`}
                style={{ height: ROW_HEIGHT }}
              >
                ${price.toFixed(2)}
              </div>
            );
          })}
        </div>

        {/* Price chart area with trail */}
        <div 
          className="absolute top-0 bottom-0 z-20"
          style={{ left: 64, width: PRICE_LINE_X - 64 }}
        >
          <svg className="w-full h-full">
            {/* Price trail */}
            {priceHistory.length > 1 && (
              <path
                d={priceHistory.slice(-60).map((p, i, arr) => {
                  const x = (i / Math.max(arr.length - 1, 1)) * (PRICE_LINE_X - 64);
                  const y = getPriceY(p.price);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(239, 68, 68, 0.7)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          
          {/* Current price dot */}
          <div 
            className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md"
            style={{ 
              right: -6,
              top: priceY - 6,
            }}
          />
        </div>

        {/* Horizontal price line extending into grid */}
        <div 
          className="absolute left-16 right-0 h-[2px] bg-red-500/30 z-10 pointer-events-none"
          style={{ top: priceY }}
        />

        {/* Grid cells - scrolling area */}
        <div 
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ left: PRICE_LINE_X }}
        >
          <div 
            className="h-full relative"
            style={{ transform: `translateX(${-scrollX}px)` }}
          >
            {priceRows.map((price, rowIdx) => {
              const priceDistance = Math.abs(rowIdx - Math.floor(VISIBLE_ROWS / 2));
              const isCurrentRow = priceDistance === 0;
              
              return (
                <div 
                  key={price}
                  className={`absolute flex ${isCurrentRow ? 'bg-red-50/30' : ''}`}
                  style={{ 
                    top: rowIdx * ROW_HEIGHT,
                    height: ROW_HEIGHT,
                    left: 0,
                  }}
                >
                  {columns.map((col, colIdx) => {
                    const multiplier = getMultiplier(priceDistance, colIdx);
                    const bet = getBetForCell(price, col.id);
                    
                    // Styling based on bet status
                    let bgClass = 'bg-transparent hover:bg-gray-100/50';
                    let textClass = 'text-gray-500';
                    let borderClass = 'border-gray-200/50';
                    
                    if (bet) {
                      if (bet.status === 'pending') {
                        bgClass = 'bg-orange-100';
                        borderClass = 'border-orange-300';
                        textClass = 'text-orange-600';
                      } else if (bet.status === 'won') {
                        bgClass = 'bg-green-100';
                        borderClass = 'border-green-400';
                        textClass = 'text-green-600';
                      } else {
                        bgClass = 'bg-red-100';
                        borderClass = 'border-red-300';
                        textClass = 'text-red-400';
                      }
                    }
                    
                    return (
                      <button
                        key={col.id}
                        onClick={() => !bet && placeBet(price, col.id, multiplier)}
                        disabled={!!bet}
                        className={`shrink-0 flex flex-col items-center justify-center border-r border-b transition-colors ${bgClass} ${borderClass}`}
                        style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                      >
                        <span className={`text-sm font-semibold ${textClass}`}>
                          {multiplier}x
                        </span>
                        <span className={`text-[10px] ${textClass} opacity-60`}>
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

      {/* Bet amount selector */}
      <div className="h-28 bg-white border-t border-gray-200 flex items-center justify-center z-50 shrink-0">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="text-xs text-gray-500 mb-1 text-center font-medium">BET AMOUNT (SOL)</div>
          <div className="text-2xl font-bold text-center text-gray-900 mb-3">{BET_AMOUNT}</div>
          <div className="flex gap-2">
            {[0.01, 0.05, 0.1, 0.25].map(amt => (
              <button
                key={amt}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
        powered by <a href="https://magicblock.gg" className="text-purple-500 ml-1 hover:underline">MagicBlock</a>
      </div>
    </div>
  );
}
