'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const ROW_HEIGHT = 70;
const COLUMN_WIDTH = 100;
const VISIBLE_ROWS = 10;
const PRICE_STEP = 0.01;
const BASE_PRICE = 86.56;
const SCROLL_SPEED = 25;
const BET_AMOUNT = 0.01;

interface Bet {
  id: string;
  price: number;
  column: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: number;
  x: number; // track x position for animation
}

interface Toast {
  id: string;
  type: 'won' | 'lost';
  amount: number;
  multiplier: number;
}

interface PricePoint {
  price: number;
  time: number;
}

export function BettingGrid() {
  const [currentPrice, setCurrentPrice] = useState(BASE_PRICE);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [scrollX, setScrollX] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confetti, setConfetti] = useState<{x: number, y: number, id: string}[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const priceLineX = 120;

  // Price simulation with history
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const drift = (Math.random() - 0.5) * 0.02;
        const newPrice = prev + drift;
        setPriceHistory(h => [...h.slice(-50), { price: newPrice, time: Date.now() }]);
        return newPrice;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Scroll animation
  useEffect(() => {
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
  }, []);

  // Check bet outcomes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setBets(prevBets => {
        const updated = prevBets.map(bet => {
          if (bet.status !== 'pending') return bet;
          
          const betAge = (now - bet.createdAt) / 1000;
          const expectedX = priceLineX + bet.column * COLUMN_WIDTH - scrollX;
          
          // When bet crosses the price line
          if (expectedX <= priceLineX) {
            const won = Math.abs(currentPrice - bet.price) < PRICE_STEP * 2;
            
            // Add toast
            setToasts(t => [...t, {
              id: bet.id,
              type: won ? 'won' : 'lost',
              amount: won ? BET_AMOUNT * bet.multiplier : BET_AMOUNT,
              multiplier: bet.multiplier
            }]);
            
            // Add confetti if won
            if (won) {
              const particles = Array.from({ length: 20 }, (_, i) => ({
                id: `${bet.id}-${i}`,
                x: priceLineX,
                y: 300
              }));
              setConfetti(c => [...c, ...particles]);
            }
            
            return { ...bet, status: (won ? 'won' : 'lost') as 'won' | 'lost' };
          }
          return bet;
        });
        
        // Remove old bets
        return updated.filter(bet => {
          if (bet.status !== 'pending') {
            return now - bet.createdAt < 3000;
          }
          return true;
        });
      });
      
      // Clear old toasts
      setToasts(t => t.filter(toast => {
        const bet = bets.find(b => b.id === toast.id);
        return bet && Date.now() - bet.createdAt < 5000;
      }));
      
      // Clear confetti
      setConfetti(c => c.slice(-30));
    }, 50);
    return () => clearInterval(interval);
  }, [currentPrice, scrollX, bets]);

  const placeBet = useCallback((price: number, column: number, multiplier: number) => {
    const newBet: Bet = {
      id: `${Date.now()}-${Math.random()}`,
      price,
      column,
      multiplier,
      status: 'pending',
      createdAt: Date.now(),
      x: priceLineX + column * COLUMN_WIDTH
    };
    setBets(prev => [...prev, newBet]);
  }, []);

  // Generate price rows
  const priceRows: number[] = [];
  const centerPrice = Math.round(currentPrice / PRICE_STEP) * PRICE_STEP;
  for (let i = Math.floor(VISIBLE_ROWS / 2); i >= -Math.floor(VISIBLE_ROWS / 2) + 1; i--) {
    priceRows.push(Number((centerPrice + i * PRICE_STEP).toFixed(2)));
  }

  const getBetForCell = (price: number, colIdx: number) => {
    return bets.find(b => Math.abs(b.price - price) < 0.005 && b.column === colIdx);
  };

  // Calculate columns visible
  const totalColumns = 15;
  const columnOffset = Math.floor(scrollX / COLUMN_WIDTH);

  // Price line Y position
  const getPriceY = (price: number) => {
    const maxPrice = Math.max(...priceRows);
    const minPrice = Math.min(...priceRows);
    const range = maxPrice - minPrice;
    if (range === 0) return VISIBLE_ROWS * ROW_HEIGHT / 2;
    return ((maxPrice - price) / range) * (VISIBLE_ROWS * ROW_HEIGHT);
  };

  const currentY = getPriceY(currentPrice);

  return (
    <div className="fixed inset-0 bg-[#faf9f7] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💜</span>
          <span className="font-bold text-gray-900 text-xl">flipr.lol</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">SOL/USD</div>
            <div className="text-xl font-bold text-gray-900">${currentPrice.toFixed(2)}</div>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div 
        ref={gridRef}
        className="absolute top-14 left-0 right-0 bottom-0"
      >
        {/* Price labels on left */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#faf9f7] z-30 flex flex-col justify-between py-4">
          {priceRows.map(price => (
            <div 
              key={price} 
              className={`text-xs font-mono pr-2 text-right ${
                Math.abs(price - currentPrice) < PRICE_STEP ? 'text-red-500 font-bold' : 'text-gray-400'
              }`}
            >
              ${price.toFixed(2)}
            </div>
          ))}
        </div>

        {/* Price line with trail */}
        <div className="absolute left-16 top-0 bottom-0 z-40 pointer-events-none" style={{ width: priceLineX - 16 }}>
          <svg className="w-full h-full">
            {/* Trail path */}
            {priceHistory.length > 1 && (
              <path
                d={priceHistory.map((p, i) => {
                  const x = priceLineX - 16 - (priceHistory.length - 1 - i) * 3;
                  const y = getPriceY(p.price) + 56;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="rgba(239, 68, 68, 0.6)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {/* Current dot */}
            <circle
              cx={priceLineX - 16}
              cy={currentY + 56}
              r="6"
              fill="#ef4444"
            />
          </svg>
        </div>

        {/* Grid cells */}
        <div 
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ left: priceLineX, right: 0 }}
        >
          <div 
            className="h-full flex flex-col"
            style={{ transform: `translateX(${-(scrollX % COLUMN_WIDTH)}px)` }}
          >
            {priceRows.map((price, rowIdx) => (
              <div 
                key={price} 
                className="flex shrink-0"
                style={{ height: ROW_HEIGHT }}
              >
                {Array.from({ length: totalColumns }).map((_, colIdx) => {
                  const actualCol = colIdx + columnOffset;
                  const multiplier = colIdx <= 2 ? (3 - colIdx * 0.5 + 1).toFixed(1) : 
                                     colIdx <= 5 ? (2 - (colIdx - 3) * 0.3).toFixed(1) : 
                                     (1.5 - Math.min(colIdx - 6, 5) * 0.05).toFixed(1);
                  const mult = parseFloat(multiplier);
                  const bet = getBetForCell(price, actualCol);
                  
                  // Styling
                  let bgColor = 'transparent';
                  let borderColor = 'rgba(0,0,0,0.05)';
                  let textColor = 'text-gray-400';
                  
                  if (bet) {
                    if (bet.status === 'pending') {
                      bgColor = 'rgba(251, 191, 36, 0.4)'; // orange/yellow
                      borderColor = 'rgba(251, 191, 36, 0.8)';
                      textColor = 'text-orange-700';
                    } else if (bet.status === 'won') {
                      bgColor = 'rgba(134, 239, 172, 0.5)'; // green
                      borderColor = 'rgba(34, 197, 94, 0.8)';
                      textColor = 'text-green-700';
                    } else {
                      bgColor = 'rgba(252, 165, 165, 0.4)'; // red
                      borderColor = 'rgba(239, 68, 68, 0.5)';
                      textColor = 'text-red-400';
                    }
                  }
                  
                  return (
                    <button
                      key={colIdx}
                      onClick={() => !bet && placeBet(price, actualCol, mult)}
                      disabled={!!bet}
                      className={`shrink-0 flex flex-col items-center justify-center border transition-all duration-150 hover:bg-gray-100 ${textColor}`}
                      style={{ 
                        width: COLUMN_WIDTH, 
                        height: ROW_HEIGHT,
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                      }}
                    >
                      <span className="text-sm font-semibold">{mult}x</span>
                      <span className="text-xs opacity-60">${price.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Confetti particles */}
        {confetti.map(p => (
          <div
            key={p.id}
            className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping"
            style={{
              left: p.x + Math.random() * 100 - 50,
              top: p.y + Math.random() * 100 - 50,
            }}
          />
        ))}
      </div>

      {/* Toast notifications */}
      <div className="fixed right-4 top-20 flex flex-col gap-2 z-50">
        {toasts.slice(-5).map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-slide-in ${
              toast.type === 'won' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'won' 
              ? `Won +${toast.amount.toFixed(3)} SOL at ${toast.multiplier}x` 
              : `Lost -${toast.amount.toFixed(3)} SOL`}
          </div>
        ))}
      </div>

      {/* Bet amount selector */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl p-4 z-50">
        <div className="text-xs text-gray-500 mb-2">BET AMOUNT (SOL)</div>
        <div className="text-2xl font-bold text-center mb-3">{BET_AMOUNT}</div>
        <div className="flex gap-2">
          {[0.01, 0.05, 0.1, 0.25].map(amt => (
            <button
              key={amt}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                amt === BET_AMOUNT 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
