'use client';

import { motion } from 'framer-motion';
import { useBetStore } from '@/store/betStore';
import { useMemo } from 'react';

interface PriceLineProps {
  gridHeight: number;
  rowHeight: number;
}

export function PriceLine({ gridHeight, rowHeight }: PriceLineProps) {
  const { currentPrice, priceHistory, priceStep, rowCount } = useBetStore();
  const priceRows = useBetStore((s) => s.getPriceRows());
  
  // Calculate Y position for current price
  const getYPosition = (price: number) => {
    if (priceRows.length === 0) return gridHeight / 2;
    
    const maxPrice = Math.max(...priceRows);
    const minPrice = Math.min(...priceRows);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return gridHeight / 2;
    
    const normalizedPrice = (maxPrice - price) / priceRange;
    return normalizedPrice * (gridHeight - rowHeight) + rowHeight / 2;
  };

  const currentY = getYPosition(currentPrice);

  // Generate trail path from price history
  const trailPath = useMemo(() => {
    if (priceHistory.length < 2) return null;
    
    const now = Date.now();
    const recentHistory = priceHistory
      .filter((p) => now - p.timestamp < 10000) // last 10 seconds
      .slice(-50);
    
    if (recentHistory.length < 2) return null;

    const points = recentHistory.map((p, i) => {
      const age = (now - p.timestamp) / 1000; // seconds ago
      const x = 120 - (age * 12); // spread over ~120px to the left
      const y = getYPosition(p.price);
      return { x, y };
    });

    // Create smooth path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return d;
  }, [priceHistory, currentPrice, priceRows]);

  return (
    <div 
      className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none"
      style={{ width: '130px' }}
    >
      {/* SVG for price trail */}
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible"
        style={{ left: '-10px' }}
      >
        {/* Trail/snake path */}
        {trailPath && (
          <motion.path
            d={trailPath}
            fill="none"
            stroke="url(#trailGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.1 }}
          />
        )}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.1)" />
            <stop offset="50%" stopColor="rgba(239, 68, 68, 0.5)" />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 1)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Current price marker */}
      <motion.div
        className="absolute right-0 flex items-center"
        animate={{ y: currentY - 16 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Price label */}
        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-l-md shadow-lg whitespace-nowrap">
          ${currentPrice.toFixed(2)}
        </div>
        
        {/* Arrow pointer */}
        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-red-500" />
      </motion.div>

      {/* Vertical line at price line position */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-red-500/20 via-red-500 to-red-500/20"
        style={{
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)',
        }}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-[40px]"
        style={{
          background: 'linear-gradient(to left, rgba(239, 68, 68, 0.15), transparent)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}
