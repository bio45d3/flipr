'use client';

import { GridCell } from './GridCell';
import { useBetStore, Bet } from '@/store/betStore';

interface PriceRowProps {
  price: number;
  timeWindows: number[];
  currentPrice: number;
  bets: Bet[];
}

export function PriceRow({ price, timeWindows, currentPrice, bets }: PriceRowProps) {
  const isCurrentPriceRow = Math.abs(price - currentPrice) < 0.005;
  
  // Calculate multiplier for each cell
  const getMultiplier = (targetPrice: number, timeWindow: number) => {
    const priceDiff = Math.abs(targetPrice - currentPrice);
    const pricePercent = (priceDiff / currentPrice) * 100;
    
    // Base multiplier from price distance (farther = higher)
    const baseMultiplier = 1 + (pricePercent * 2);
    
    // Time factor (shorter time = higher multiplier)
    const timeFactor = Math.max(0.8, 1.5 - (timeWindow / 60));
    
    const multiplier = baseMultiplier * timeFactor;
    return Math.min(10, Math.max(1.05, multiplier));
  };

  const getBetForCell = (targetPrice: number, timeWindow: number) => {
    return bets.find(
      (b) => Math.abs(b.targetPrice - targetPrice) < 0.01 && b.timeWindow === timeWindow
    );
  };

  return (
    <div className={`flex items-center gap-1 ${isCurrentPriceRow ? 'relative z-10' : ''}`}>
      {/* Price label */}
      <div className={`w-20 pr-2 text-right font-mono text-sm ${
        price > currentPrice ? 'text-green-400' : 
        price < currentPrice ? 'text-red-400' : 
        'text-white font-bold'
      }`}>
        ${price.toFixed(2)}
      </div>
      
      {/* Cells for each time window */}
      <div className="flex gap-1">
        {timeWindows.map((tw) => (
          <GridCell
            key={`${price}-${tw}`}
            targetPrice={price}
            timeWindow={tw}
            multiplier={getMultiplier(price, tw)}
            currentPrice={currentPrice}
            bet={getBetForCell(price, tw)}
          />
        ))}
      </div>
    </div>
  );
}
