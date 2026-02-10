'use client';

import { PriceDisplay } from './PriceDisplay';
import { BetPanel } from './BetPanel';

interface ActiveBet {
  id: string;
  direction: 'up' | 'down';
  amount: number;
  entryPrice: number;
  expiresAt: Date;
  status: 'pending' | 'won' | 'lost';
}

interface BettingGridProps {
  activeBets?: ActiveBet[];
}

export function BettingGrid({ activeBets = [] }: BettingGridProps) {
  const handleBet = (direction: 'up' | 'down', amount: number, duration: number) => {
    // TODO: Implement actual bet placement via Anchor
    console.log('Placing bet:', { direction, amount, duration });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Price Display */}
      <div className="text-center py-8">
        <PriceDisplay />
      </div>

      {/* Bet Panel */}
      <BetPanel onBet={handleBet} />

      {/* Active Bets */}
      {activeBets.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-4">
            Active Bets
          </h3>
          <div className="space-y-3">
            {activeBets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center
                    ${bet.direction === 'up' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                  >
                    {bet.direction === 'up' ? '↑' : '↓'}
                  </div>
                  <div>
                    <div className="font-medium">{bet.amount} SOL</div>
                    <div className="text-xs text-zinc-500">
                      Entry: ${bet.entryPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium
                    ${bet.status === 'won' ? 'text-green-500' : 
                      bet.status === 'lost' ? 'text-red-500' : 'text-zinc-400'}`}
                  >
                    {bet.status === 'pending' ? 'In Progress' : 
                     bet.status === 'won' ? 'Won!' : 'Lost'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {bet.status === 'pending' && (
                      <>Expires: {bet.expiresAt.toLocaleTimeString()}</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Placeholder */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">--</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Volume</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">--</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Pool Size</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">--</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Your Bets</div>
        </div>
      </div>
    </div>
  );
}
