'use client';

import { motion } from 'framer-motion';
import { useBetStore, Bet } from '@/store/betStore';

interface GridCellProps {
  targetPrice: number;
  timeWindow: number;
  multiplier: number;
  currentPrice: number;
  bet?: Bet;
}

export function GridCell({ targetPrice, timeWindow, multiplier, currentPrice, bet }: GridCellProps) {
  const selectCell = useBetStore((s) => s.selectCell);
  
  const isAboveCurrent = targetPrice > currentPrice;
  const priceDistance = Math.abs(targetPrice - currentPrice);
  
  // Determine cell styling based on bet status
  const getBetStyles = () => {
    if (!bet) return '';
    
    switch (bet.status) {
      case 'active':
        return 'ring-2 ring-orange-500 bg-orange-500/20';
      case 'won':
        return 'ring-2 ring-green-500 bg-green-500/30';
      case 'lost':
        return 'ring-2 ring-red-500 bg-red-500/20 opacity-50';
      default:
        return '';
    }
  };

  const handleClick = () => {
    if (bet) return; // Don't allow clicking on cells with active bets
    selectCell(targetPrice, timeWindow);
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center p-2 cursor-pointer
        border border-zinc-800/50 rounded-lg min-w-[80px] h-[52px]
        transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/30
        ${getBetStyles()}
        ${!bet ? 'hover:scale-105' : ''}
      `}
      whileHover={!bet ? { scale: 1.02 } : {}}
      whileTap={!bet ? { scale: 0.98 } : {}}
      initial={bet?.status === 'won' ? { scale: 1 } : {}}
      animate={bet?.status === 'won' ? { 
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 }
      } : bet?.status === 'lost' ? {
        opacity: [1, 0.3],
        scale: [1, 0.95],
        transition: { duration: 0.5 }
      } : {}}
    >
      {/* Multiplier */}
      <div className={`text-sm font-bold ${
        multiplier >= 2.5 ? 'text-yellow-400' : 
        multiplier >= 1.5 ? 'text-green-400' : 
        'text-zinc-400'
      }`}>
        {multiplier.toFixed(2)}x
      </div>
      
      {/* Price indicator */}
      <div className="text-[10px] text-zinc-500">
        ${targetPrice.toFixed(2)}
      </div>

      {/* Win overlay */}
      {bet?.status === 'won' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-green-500/40 rounded-lg"
        >
          <div className="text-xs font-bold text-green-300">
            +{bet.payout?.toFixed(3)} SOL
          </div>
        </motion.div>
      )}

      {/* Active bet indicator */}
      {bet?.status === 'active' && (
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.div>
  );
}
