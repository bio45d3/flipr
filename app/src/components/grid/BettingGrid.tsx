'use client';

import { useState, useEffect, useCallback } from 'react';

const ROW_HEIGHT = 75;
const COLUMN_WIDTH = 90;
const VISIBLE_ROWS = 8;
const VISIBLE_COLUMNS = 10;
const PRICE_STEP = 0.10;
const BASE_PRICE = 135.50;
const SCROLL_SPEED = 30; // pixels per second
const BET_AMOUNT = 0.01; // default bet amount

interface Bet {
  id: string;
  price: number;
  column: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: number;
}

export function BettingGrid() {
  const [currentPrice, setCurrentPrice] = useState(BASE_PRICE);
  const [scrollX, setScrollX] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [columnOffset, setColumnOffset] = useState(0);

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
      
      setScrollX(prev => {
        const newScroll = prev + (SCROLL_SPEED * delta) / 1000;
        // When we've scrolled a full column width, shift columns
        if (newScroll >= COLUMN_WIDTH) {
          setColumnOffset(offset => offset + 1);
          return newScroll - COLUMN_WIDTH;
        }
        return newScroll;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Check bet outcomes
  useEffect(() => {
    const interval = setInterval(() => {
      setBets(prevBets => 
        prevBets.map(bet => {
          if (bet.status !== 'pending') return bet;
          
          // Check if this bet's column has reached the price line
          const betAge = (Date.now() - bet.createdAt) / 1000;
          const columnsTraveled = Math.floor(betAge / 3); // 3 seconds per column
          
          if (columnsTraveled >= bet.column) {
            // Resolve the bet
            const won = Math.abs(currentPrice - bet.price) < PRICE_STEP / 2;
            return { ...bet, status: (won ? 'won' : 'lost') as 'won' | 'lost' };
          }
          return bet;
        }).filter(bet => {
          // Remove old resolved bets
          if (bet.status !== 'pending') {
            const age = Date.now() - bet.createdAt;
            return age < 5000; // Keep for 5 seconds after resolution
          }
          return true;
        })
      );
    }, 100);
    return () => clearInterval(interval);
  }, [currentPrice]);

  // Place a bet instantly on click
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

  // Generate price rows centered around current price
  const priceRows = [];
  const centerPrice = Math.round(currentPrice / PRICE_STEP) * PRICE_STEP;
  for (let i = Math.floor(VISIBLE_ROWS / 2); i >= -Math.floor(VISIBLE_ROWS / 2) + 1; i--) {
    priceRows.push(Number((centerPrice + i * PRICE_STEP).toFixed(2)));
  }

  // Get bet for a cell
  const getBetForCell = (price: number, colIdx: number) => {
    return bets.find(b => 
      Math.abs(b.price - price) < 0.01 && 
      b.column === colIdx
    );
  };

  const gridHeight = VISIBLE_ROWS * ROW_HEIGHT;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">SOL/USD Grid</h2>
          <p className="text-sm text-zinc-500">Click cells to place {BET_AMOUNT} SOL bets</p>
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
          style={{ background: 'linear-gradient(to right, #0a0a0f 80%, transparent)' }}
        >
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg shadow-red-500/50">
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
              <div key={price} className="flex gap-1">
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
                  const bet = getBetForCell(price, colIdx);
                  
                  // Cell styling based on bet status
                  let cellStyle = 'border-zinc-700/50 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-600';
                  let glowStyle = '';
                  
                  if (bet) {
                    if (bet.status === 'pending') {
                      cellStyle = 'border-orange-500 bg-orange-500/30 animate-pulse';
                      glowStyle = 'shadow-lg shadow-orange-500/50';
                    } else if (bet.status === 'won') {
                      cellStyle = 'border-green-400 bg-green-500/40';
                      glowStyle = 'shadow-lg shadow-green-500/50';
                    } else {
                      cellStyle = 'border-red-500/50 bg-red-500/30 opacity-50';
                    }
                  }
                  
                  return (
                    <button
                      key={colIdx}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 transition-all ${cellStyle} ${glowStyle}`}
                      style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT - 5 }}
                      onClick={() => !bet && placeBet(price, colIdx, multiplier)}
                      disabled={!!bet}
                    >
                      {bet?.status === 'won' ? (
                        <>
                          <span className="text-lg font-bold text-green-300">+{(BET_AMOUNT * multiplier).toFixed(3)}</span>
                          <span className="text-xs text-green-400">WON {multiplier}x</span>
                        </>
                      ) : bet?.status === 'lost' ? (
                        <>
                          <span className="text-lg font-bold text-red-300">-{BET_AMOUNT}</span>
                          <span className="text-xs text-red-400">LOST</span>
                        </>
                      ) : bet?.status === 'pending' ? (
                        <>
                          <span className="text-lg font-bold text-orange-300">{BET_AMOUNT}</span>
                          <span className="text-xs text-orange-400">{multiplier}x</span>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active bets count */}
      {bets.filter(b => b.status === 'pending').length > 0 && (
        <div className="mt-4 text-center text-sm text-orange-400">
          {bets.filter(b => b.status === 'pending').length} active bet(s)
        </div>
      )}

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
