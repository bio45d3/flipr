'use client';

import { create } from 'zustand';

export interface Bet {
  id: string;
  row: number; // price row index
  columnId: string; // unique column identifier
  targetPrice: number;
  arrivalTime: number; // when this column reaches the price line
  amount: number;
  multiplier: number;
  entryPrice: number;
  placedAt: number;
  status: 'pending' | 'won' | 'lost';
  payout?: number;
  isOwn: boolean; // true if user's bet, false if other players
}

export interface GridColumn {
  id: string;
  createdAt: number;
  timeOffset: number; // seconds from now when this column reaches price line
}

interface PricePoint {
  price: number;
  timestamp: number;
}

interface BetStore {
  bets: Bet[];
  currentPrice: number;
  priceHistory: PricePoint[];
  scrollOffset: number; // pixels scrolled
  columns: GridColumn[];
  selectedCell: { row: number; columnId: string; targetPrice: number; multiplier: number; arrivalTime: number } | null;
  modalOpen: boolean;
  
  // Price rows config
  priceStep: number;
  rowCount: number;
  
  // Actions
  setCurrentPrice: (price: number) => void;
  addPricePoint: (price: number) => void;
  setScrollOffset: (offset: number) => void;
  generateColumns: () => void;
  selectCell: (row: number, columnId: string, targetPrice: number, multiplier: number, arrivalTime: number) => void;
  clearSelection: () => void;
  closeModal: () => void;
  placeBet: (amount: number) => void;
  resolveBet: (betId: string, won: boolean) => void;
  removeBet: (betId: string) => void;
  getPriceRows: () => number[];
}

const COLUMN_WIDTH = 90; // px
const SCROLL_SPEED = 30; // px per second
const COLUMN_INTERVAL = 3; // seconds between columns

export const useBetStore = create<BetStore>((set, get) => ({
  bets: [],
  currentPrice: 135.50,
  priceHistory: [],
  scrollOffset: 0,
  columns: [],
  selectedCell: null,
  modalOpen: false,
  priceStep: 0.10, // $0.10 per row
  rowCount: 8,

  setCurrentPrice: (price) => set({ currentPrice: price }),

  addPricePoint: (price) => {
    const now = Date.now();
    set((state) => ({
      currentPrice: price,
      priceHistory: [
        ...state.priceHistory.filter((p) => now - p.timestamp < 30000), // keep 30s
        { price, timestamp: now },
      ],
    }));
  },

  setScrollOffset: (offset) => set({ scrollOffset: offset }),

  generateColumns: () => {
    const now = Date.now();
    const columns: GridColumn[] = [];
    
    // Generate columns for next 60 seconds
    for (let i = 0; i < 20; i++) {
      columns.push({
        id: `col-${now}-${i}`,
        createdAt: now,
        timeOffset: i * COLUMN_INTERVAL, // 0s, 3s, 6s, 9s...
      });
    }
    
    set({ columns });
  },

  selectCell: (row, columnId, targetPrice, multiplier, arrivalTime) => {
    set({ 
      selectedCell: { row, columnId, targetPrice, multiplier, arrivalTime }, 
      modalOpen: true 
    });
  },

  clearSelection: () => set({ selectedCell: null }),

  closeModal: () => set({ modalOpen: false, selectedCell: null }),

  placeBet: (amount) => {
    const { selectedCell, currentPrice, columns } = get();
    if (!selectedCell) return;

    const column = columns.find((c) => c.id === selectedCell.columnId);
    if (!column) return;

    const now = Date.now();
    const bet: Bet = {
      id: `bet-${now}-${Math.random().toString(36).substr(2, 9)}`,
      row: selectedCell.row,
      columnId: selectedCell.columnId,
      targetPrice: selectedCell.targetPrice,
      arrivalTime: selectedCell.arrivalTime,
      amount,
      multiplier: selectedCell.multiplier,
      entryPrice: currentPrice,
      placedAt: now,
      status: 'pending',
      isOwn: true,
    };

    set((state) => ({
      bets: [...state.bets, bet],
      modalOpen: false,
      selectedCell: null,
    }));
  },

  resolveBet: (betId, won) => {
    set((state) => ({
      bets: state.bets.map((b) =>
        b.id === betId
          ? { 
              ...b, 
              status: won ? 'won' : 'lost', 
              payout: won ? b.amount * b.multiplier : 0 
            }
          : b
      ),
    }));
  },

  removeBet: (betId) =>
    set((state) => ({
      bets: state.bets.filter((b) => b.id !== betId),
    })),

  getPriceRows: () => {
    const { currentPrice, priceStep, rowCount } = get();
    const halfRows = Math.floor(rowCount / 2);
    const centerPrice = Math.round(currentPrice / priceStep) * priceStep;
    
    const rows: number[] = [];
    for (let i = halfRows; i >= -halfRows + 1; i--) {
      rows.push(parseFloat((centerPrice + i * priceStep).toFixed(2)));
    }
    return rows;
  },
}));

export { COLUMN_WIDTH, SCROLL_SPEED, COLUMN_INTERVAL };
