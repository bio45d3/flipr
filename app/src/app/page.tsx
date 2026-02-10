'use client';

import dynamic from 'next/dynamic';

// Dynamically import BettingGrid to avoid SSR issues with Pyth client
const BettingGrid = dynamic(
  () => import('@/components/grid/BettingGrid').then((mod) => mod.BettingGrid),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#faf9f7] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }
);

export default function Home() {
  return <BettingGrid />;
}
