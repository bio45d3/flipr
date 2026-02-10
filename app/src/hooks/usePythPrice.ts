'use client';

import { useState, useEffect, useCallback } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';
import { PYTH_SOL_USD_FEED_ID, PYTH_HERMES_ENDPOINT } from '@/lib/constants';

export interface PriceData {
  price: number;
  confidence: number;
  timestamp: Date;
  expo: number;
}

export function usePythPrice() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const client = new HermesClient(PYTH_HERMES_ENDPOINT);
      const priceUpdates = await client.getLatestPriceUpdates([PYTH_SOL_USD_FEED_ID]);
      
      if (priceUpdates.parsed && priceUpdates.parsed.length > 0) {
        const update = priceUpdates.parsed[0];
        const price = update.price;
        
        setPriceData({
          price: Number(price.price) * Math.pow(10, price.expo),
          confidence: Number(price.conf) * Math.pow(10, price.expo),
          timestamp: new Date(Number(price.publish_time) * 1000),
          expo: price.expo,
        });
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch price:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    
    // Poll every 1 second for price updates
    const interval = setInterval(fetchPrice, 1000);
    
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { priceData, isLoading, error, refetch: fetchPrice };
}
