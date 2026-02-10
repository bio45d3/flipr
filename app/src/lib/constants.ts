import { PublicKey } from '@solana/web3.js';

// Program ID - replace with deployed program ID
export const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

// Pyth SOL/USD price feed ID (mainnet)
export const PYTH_SOL_USD_FEED_ID = 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';

// Hermes endpoint for Pyth price feeds
export const PYTH_HERMES_ENDPOINT = 'https://hermes.pyth.network';

// RPC endpoints
export const RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
} as const;

// Bet durations in seconds
export const BET_DURATIONS = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '1h', seconds: 3600 },
] as const;

// Default bet amounts in SOL
export const DEFAULT_BET_AMOUNTS = [0.1, 0.25, 0.5, 1, 2.5, 5] as const;

// Theme colors
export const COLORS = {
  up: '#22c55e', // green-500
  down: '#ef4444', // red-500
  background: '#0a0a0a',
  card: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  muted: '#71717a',
} as const;
