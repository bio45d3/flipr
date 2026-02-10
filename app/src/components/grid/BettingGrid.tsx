'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { GridCell } from './GridCell';
import { PriceLine } from './PriceLine';
import { BetModal } from './BetModal';
import { Confetti } from './Confetti';
import { useBetStore, COLUMN_WIDTH, SCROLL_SPEED, COLUMN_INTERVAL, Bet } from '@/store/betStore';

const ROW_HEIGHT = 75;
const PRICE_LINE_X = 130; // px from left where price line sits
const VISIBLE_COLUMNS = 12;

export function BettingGrid() {
  const {
    currentPrice,
    addPricePoint,
    bets,
    columns,
    generateColumns,
    resolveBet,
    removeBet,
    priceStep,
    rowCount,
    getPriceRows,
  } = useBetStore();
  
  const [scrollX, setScrollX] = useState(0);
  const [priceRows, setPriceRows] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const lastColumnTimeRef = useRef(Date.now());

  // Initialize
  useEffect(() => {
    generateColumns();
    setPriceRows(getPriceRows());
    startTimeRef.current = Date.now();
  }, []);

  // Update price rows when price changes significantly
  useEffect(() => {
    const rows = getPriceRows();
    if (rows.length > 0) {
      const currentMin = Math.min(...priceRows);
      const currentMax = Math.max(...priceRows);
      const newMin = Math.min(...rows);
      const newMax = Math.max(...rows);
      
      // Only update if price drifted outside current range
      if (priceRows.length === 0 || currentPrice < currentMin || currentPrice > currentMax) {
        setPriceRows(rows);
      }
    }
  }, [currentPrice]);

  // Simulate price movement
  useEffect(() => {
    const interval = setInterval(() => {
      const drift = (Math.random() - 0.5) * 0.03;
      const newPrice = currentPrice + drift;
      addPricePoint(newPrice);
    }, 200);
    
    return () => clearInterval(interval);
  }, [currentPrice, addPricePoint]);

  // Animation loop for scrolling
  useAnimationFrame((time, delta) => {
    const deltaSeconds = delta / 1000;
    setScrollX((prev) => prev + SCROLL_SPEED * deltaSeconds);
    
    // Add new columns as needed
    const now = Date.now();
    if (now - lastColumnTimeRef.current > COLUMN_INTERVAL * 1000) {
      lastColumnTimeRef.current = now;
      // Columns are generated in batch, so we just track for bet resolution
    }
  });

  // Check for bet resolution
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      bets.forEach((bet) => {
        if (bet.status !== 'pending') return;
        
        // Check if column has passed the price line
        const column = columns.find((c) => c.id === bet.columnId);
        if (!column) return;
        
        const columnAge = (now - column.createdAt) / 1000;
        const columnScrolled = columnAge * SCROLL_SPEED;
        const columnX = VISIBLE_COLUMNS * COLUMN_WIDTH - columnScrolled;
        
        // Column reached price line
        if (columnX <= PRICE_LINE_X) {
          // Check if price matches target row
          const priceMatch = Math.abs(currentPrice - bet.targetPrice) < priceStep / 2;
          resolveBet(bet.id, priceMatch);
          
          // Remove after animation
          setTimeout(() => removeBet(bet.id), 3000);
        }
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [bets, columns, currentPrice, priceStep, resolveBet, removeBet]);

  // Calculate multiplier based on column distance
  const getMultiplier = (columnIndex: number) => {
    // Farther columns (more time) = lower multiplier
    // Closer columns (less time) = higher multiplier
    const timeToArrival = columnIndex * COLUMN_INTERVAL;
    
    if (timeToArrival <= 3) return 5.0;
    if (timeToArrival <= 6) return 3.5;
    if (timeToArrival <= 9) return 2.5;
    if (timeToArrival <= 15) return 2.0;
    if (timeToArrival <= 24) return 1.5;
    return 1.2;
  };

  // Get bet for a specific cell
  const getBetForCell = (rowPrice: number, columnId: string): Bet | undefined => {
    return bets.find(
      (b) => Math.abs(b.targetPrice - rowPrice) < 0.01 && b.columnId === columnId
    );
  };

  const gridHeight = rowCount * ROW_HEIGHT;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">SOL/USD Grid</h2>
          <p className="text-sm text-zinc-500">Click cells ahead of the price line to bet</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-zinc-500">Live Price</div>
            <motion.div
              key={currentPrice.toFixed(2)}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-mono font-bold text-white"
            >
              ${currentPrice.toFixed(4)}
            </motion.div>
          </div>
          <motion.div 
            className="w-3 h-3 rounded-full bg-green-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
      </div>

      {/* Time axis labels */}
      <div className="flex mb-2 text-xs text-zinc-500 font-medium" style={{ paddingLeft: PRICE_LINE_X + 10 }}>
        {Array.from({ length: VISIBLE_COLUMNS }).map((_, i) => (
          <div key={i} className="text-center" style={{ width: COLUMN_WIDTH }}>
            {i * COLUMN_INTERVAL}s
          </div>
        ))}
      </div>

      {/* Main Grid Container */}
      <div 
        className="relative bg-[#0a0a0f] border border-zinc-800 rounded-xl overflow-hidden"
        style={{ height: gridHeight + 20 }}
      >
        {/* Price Line (fixed position) */}
        <PriceLine 
          gridHeight={gridHeight} 
          rowHeight={ROW_HEIGHT}
        />

        {/* Scrolling Grid */}
        <div 
          ref={gridRef}
          className="absolute top-2 bottom-2 overflow-hidden"
          style={{ 
            left: PRICE_LINE_X,
            right: 10,
          }}
        >
          <motion.div
            className="flex flex-col gap-1"
            style={{ 
              transform: `translateX(${-scrollX % (COLUMN_WIDTH * COLUMN_INTERVAL)}px)`,
            }}
          >
            {/* Price Rows */}
            {priceRows.map((price, rowIndex) => (
              <div key={price} className="flex gap-1">
                {/* Row label */}
                <div 
                  className={`flex items-center justify-end pr-2 font-mono text-sm shrink-0 ${
                    Math.abs(price - currentPrice) < priceStep / 2
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
                {columns.slice(0, VISIBLE_COLUMNS).map((column, colIndex) => {
                  const now = Date.now();
                  const timeToArrival = column.timeOffset - ((now - column.createdAt) / 1000);
                  
                  return (
                    <GridCell
                      key={`${price}-${column.id}`}
                      row={rowIndex}
                      columnId={column.id}
                      targetPrice={price}
                      multiplier={getMultiplier(colIndex)}
                      arrivalTime={now + timeToArrival * 1000}
                      bet={getBetForCell(price, column.id)}
                    />
                  );
                })}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Left fade overlay */}
        <div 
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            left: PRICE_LINE_X - 30,
            width: 40,
            background: 'linear-gradient(to right, #0a0a0f, transparent)',
          }}
        />
      </div>

      {/* Active Bets Summary */}
      {bets.filter((b) => b.status === 'pending' && b.isOwn).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
        >
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Your Active Bets ({bets.filter((b) => b.status === 'pending' && b.isOwn).length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {bets
              .filter((b) => b.status === 'pending' && b.isOwn)
              .map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2"
                >
                  <div className="text-sm font-medium text-orange-300">
                    ${bet.targetPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {bet.amount} SOL @ {bet.multiplier}x
                  </div>
                  <CountdownTimer targetTime={bet.arrivalTime} />
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500/30 border-2 border-orange-500" />
          <span>Your Bet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500/30 border-2 border-purple-500" />
          <span>Others</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/40 border-2 border-green-400" />
          <span>Won</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border-2 border-red-500/50 opacity-40" />
          <span>Lost</span>
        </div>
      </div>

      {/* Bet Modal */}
      <BetModal />

      {/* Confetti */}
      <Confetti />
    </div>
  );
}

// Countdown component
function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div className={`text-xs font-mono font-bold ${
      timeLeft <= 3 ? 'text-red-400' : 'text-orange-400'
    }`}>
      {timeLeft}s
    </div>
  );
}
