'use client';

import { create } from 'zustand';

export interface Bet {
  id: string;
  targetPrice: number;
  timeWindow: number; // seconds
  amount: number;
  multiplier: number;
  entryPrice: number;
  placedAt: number;
  expiresAt: number;
  status: 'active' | 'won' | 'lost';
  payout?: number;
}

interface BetStore {
  bets: Bet[];
  currentPrice: number;
  selectedCell: { price: number; timeWindow: number } | null;
  modalOpen: boolean;
  
  // Actions
  setCurrentPrice: (price: number) => void;
  selectCell: (price: number, timeWindow: number) => void;
  clearSelection: () => void;
  openModal: () => void;
  closeModal: () => void;
  placeBet: (amount: number) => void;
  updateBetStatus: (betId: string, status: 'won' | 'lost', payout?: number) => void;
  removeBet: (betId: string) => void;
  clearWonLost: () => void;
}

export const useBetStore = create<BetStore>((set, get) => ({
  bets: [],
  currentPrice: 135.50, // Mock SOL price
  selectedCell: null,
  modalOpen: false,

  setCurrentPrice: (price) => set({ currentPrice: price }),

  selectCell: (price, timeWindow) => {
    set({ selectedCell: { price, timeWindow }, modalOpen: true });
  },

  clearSelection: () => set({ selectedCell: null }),

  openModal: () => set({ modalOpen: true }),

  closeModal: () => set({ modalOpen: false, selectedCell: null }),

  placeBet: (amount) => {
    const { selectedCell, currentPrice } = get();
    if (!selectedCell) return;

    const priceDiff = Math.abs(selectedCell.price - currentPrice);
    const pricePercent = (priceDiff / currentPrice) * 100;
    
    // Calculate multiplier based on distance and time
    // Closer price + longer time = lower multiplier
    // Farther price + shorter time = higher multiplier
    const baseMultiplier = 1 + (pricePercent * 0.5);
    const timeMultiplier = Math.max(0.5, 2 - (selectedCell.timeWindow / 30));
    const multiplier = Math.min(10, Math.max(1.05, baseMultiplier * timeMultiplier));

    const now = Date.now();
    const bet: Bet = {
      id: `bet-${now}-${Math.random().toString(36).substr(2, 9)}`,
      targetPrice: selectedCell.price,
      timeWindow: selectedCell.timeWindow,
      amount,
      multiplier: parseFloat(multiplier.toFixed(2)),
      entryPrice: currentPrice,
      placedAt: now,
      expiresAt: now + (selectedCell.timeWindow * 1000),
      status: 'active',
    };

    set((state) => ({
      bets: [...state.bets, bet],
      modalOpen: false,
      selectedCell: null,
    }));

    // Simulate bet resolution
    setTimeout(() => {
      const currentState = get();
      const currentP = currentState.currentPrice;
      const won = currentP >= bet.targetPrice - 0.01 && currentP <= bet.targetPrice + 0.01;
      
      // Actually let's make it more realistic - win if price crosses target
      const random = Math.random();
      const isWin = random < 0.45; // 45% win rate

      set((state) => ({
        bets: state.bets.map((b) =>
          b.id === bet.id
            ? { ...b, status: isWin ? 'won' : 'lost', payout: isWin ? b.amount * b.multiplier : 0 }
            : b
        ),
      }));

      // Remove after animation
      setTimeout(() => {
        set((state) => ({
          bets: state.bets.filter((b) => b.id !== bet.id),
        }));
      }, 3000);
    }, bet.timeWindow * 1000);
  },

  updateBetStatus: (betId, status, payout) =>
    set((state) => ({
      bets: state.bets.map((b) =>
        b.id === betId ? { ...b, status, payout } : b
      ),
    })),

  removeBet: (betId) =>
    set((state) => ({
      bets: state.bets.filter((b) => b.id !== betId),
    })),

  clearWonLost: () =>
    set((state) => ({
      bets: state.bets.filter((b) => b.status === 'active'),
    })),
}));
