'use client';

import { usePythPrice } from '@/hooks/usePythPrice';
import { useState, useEffect } from 'react';

export function PriceDisplay() {
  const { priceData, isLoading, error } = usePythPrice();
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (priceData && previousPrice !== null) {
      if (priceData.price > previousPrice) {
        setPriceDirection('up');
      } else if (priceData.price < previousPrice) {
        setPriceDirection('down');
      }
    }
    if (priceData) {
      setPreviousPrice(priceData.price);
    }
  }, [priceData, previousPrice]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-zinc-500 text-sm">Loading price...</div>
        <div className="h-12 w-48 bg-zinc-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-red-500 text-sm">Error fetching price</div>
        <div className="text-zinc-500 text-xs">{error}</div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="text-zinc-500">No price data available</div>
    );
  }

  const priceColor = priceDirection === 'up' 
    ? 'text-green-500' 
    : priceDirection === 'down' 
    ? 'text-red-500' 
    : 'text-white';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-zinc-500 text-sm font-medium">SOL/USD</div>
      <div className={`text-5xl font-bold tabular-nums tracking-tight transition-colors ${priceColor}`}>
        ${priceData.price.toFixed(2)}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>±${priceData.confidence.toFixed(4)}</span>
        <span>•</span>
        <span>{priceData.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
