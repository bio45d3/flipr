'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCallback, useMemo } from 'react';

export function WalletButton() {
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = useCallback(() => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  }, [publicKey, disconnect, setVisible]);

  const displayAddress = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className="px-4 py-2 rounded-lg font-medium text-sm transition-all
        bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
    >
      {connecting ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </span>
      ) : publicKey ? (
        <span className="flex items-center gap-2">
          {wallet?.adapter.icon && (
            <img src={wallet.adapter.icon} alt="" className="w-4 h-4" />
          )}
          {displayAddress}
        </span>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}
