'use client';

import { motion } from 'framer-motion';

interface PriceLineProps {
  currentPrice: number;
  priceRange: { min: number; max: number };
  gridHeight: number;
}

export function PriceLine({ currentPrice, priceRange, gridHeight }: PriceLineProps) {
  // Calculate Y position based on price within range
  const priceSpan = priceRange.max - priceRange.min;
  const pricePosition = (priceRange.max - currentPrice) / priceSpan;
  const yPosition = pricePosition * gridHeight;

  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none z-20"
      initial={{ y: yPosition }}
      animate={{ y: yPosition }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Main line */}
      <div className="relative flex items-center">
        {/* Price label */}
        <div className="absolute -left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-l-md whitespace-nowrap z-30">
          ${currentPrice.toFixed(2)}
        </div>
        
        {/* Animated line */}
        <motion.div
          className="w-full h-[2px] bg-gradient-to-r from-red-500 via-red-400 to-red-500"
          animate={{
            opacity: [0.7, 1, 0.7],
            boxShadow: [
              '0 0 10px rgba(239, 68, 68, 0.5)',
              '0 0 20px rgba(239, 68, 68, 0.8)',
              '0 0 10px rgba(239, 68, 68, 0.5)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Pulse effect */}
        <motion.div
          className="absolute left-20 right-0 h-8 -mt-3"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.1), transparent)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
