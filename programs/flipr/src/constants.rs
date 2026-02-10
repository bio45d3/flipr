use anchor_lang::prelude::*;

/// SOL/USD Pyth feed ID (mainnet)
/// https://pyth.network/developers/price-feed-ids#solana-mainnet-beta
pub const SOL_USD_FEED_ID: &str = "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

/// Maximum age of price update in seconds (30 seconds)
pub const MAX_PRICE_AGE: u64 = 30;

/// Default platform fee in basis points (2000 = 20%)
pub const DEFAULT_PLATFORM_FEE_BPS: u16 = 2000;

/// Default LP fee in basis points (8000 = 80%)
pub const DEFAULT_LP_FEE_BPS: u16 = 8000;

/// Default minimum bet in lamports (0.01 SOL = 10_000_000 lamports)
pub const DEFAULT_MIN_BET: u64 = 10_000_000;

/// Default maximum bet in lamports (10 SOL = 10_000_000_000 lamports)
pub const DEFAULT_MAX_BET: u64 = 10_000_000_000;

/// Default row width in cents (100 = $0.01)
pub const DEFAULT_ROW_WIDTH: u64 = 100;

/// Default resolution slots (~30 slots = ~12 seconds)
pub const DEFAULT_RESOLUTION_SLOTS: u64 = 30;

/// Multiplier scale factor (10000 = 1.0x)
pub const MULTIPLIER_SCALE: u64 = 10000;

/// Seed prefixes for PDAs
pub const CONFIG_SEED: &[u8] = b"config";
pub const LP_VAULT_SEED: &[u8] = b"lp_vault";
pub const LP_VAULT_TOKENS_SEED: &[u8] = b"lp_vault_tokens";
pub const BET_SEED: &[u8] = b"bet";
