'use client';

import { motion } from 'framer-motion';
import { useBetStore, Bet } from '@/store/betStore';

interface GridCellProps {
  row: number;
  columnId: string;
  targetPrice: number;
  multiplier: number;
  arrivalTime: number;
  bet?: Bet;
}

export function GridCell({ row, columnId, targetPrice, multiplier, arrivalTime, bet }: GridCellProps) {
  const selectCell = useBetStore((s) => s.selectCell);
  
  const handleClick = () => {
    if (bet) return;
    selectCell(row, columnId, targetPrice, multiplier, arrivalTime);
  };

  // Determine cell styling based on bet status
  const getCellStyles = () => {
    if (!bet) {
      return 'bg-zinc-900/40 border-zinc-700/50 hover:bg-zinc-800/60 hover:border-zinc-600 cursor-pointer';
    }
    
    switch (bet.status) {
      case 'pending':
        return bet.isOwn 
          ? 'bg-orange-500/30 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
          : 'bg-purple-500/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      case 'won':
        return 'bg-green-500/40 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]';
      case 'lost':
        return 'bg-red-500/30 border-red-500/50 opacity-40';
      default:
        return '';
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center
        w-[90px] h-[70px] rounded-lg border-2 transition-all duration-150
        ${getCellStyles()}
      `}
      whileHover={!bet ? { scale: 1.05 } : {}}
      whileTap={!bet ? { scale: 0.95 } : {}}
      animate={bet?.status === 'won' ? {
        scale: [1, 1.1, 1],
        transition: { duration: 0.4 }
      } : bet?.status === 'lost' ? {
        opacity: [1, 0.3],
        scale: [1, 0.9],
        transition: { duration: 0.6 }
      } : {}}
    >
      {/* Multiplier */}
      <div className={`text-lg font-bold ${
        bet?.status === 'won' ? 'text-green-300' :
        bet?.status === 'lost' ? 'text-red-300' :
        bet?.isOwn ? 'text-orange-300' :
        bet ? 'text-purple-300' :
        multiplier >= 3 ? 'text-yellow-400' : 
        multiplier >= 2 ? 'text-green-400' : 
        'text-zinc-400'
      }`}>
        {multiplier.toFixed(2)}x
      </div>
      
      {/* Target Price */}
      <div className={`text-xs font-mono ${
        bet ? 'text-white/70' : 'text-zinc-500'
      }`}>
        ${targetPrice.toFixed(2)}
      </div>

      {/* Bet amount indicator */}
      {bet && (
        <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
          bet.isOwn ? 'bg-orange-500 text-white' : 'bg-purple-500 text-white'
        }`}>
          {bet.amount}
        </div>
      )}

      {/* Win overlay */}
      {bet?.status === 'won' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg backdrop-blur-sm"
        >
          <div className="text-sm font-bold text-green-300">
            +{bet.payout?.toFixed(3)}
          </div>
        </motion.div>
      )}

      {/* Pending pulse */}
      {bet?.status === 'pending' && bet.isOwn && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-orange-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
