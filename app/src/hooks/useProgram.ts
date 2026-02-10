'use client';

import { useMemo } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { getProgram, FliprProgram } from '@/lib/program';

export function useProgram(): FliprProgram | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    return getProgram(connection, wallet);
  }, [connection, wallet]);

  return program;
}
