use anchor_lang::prelude::*;

/// Global configuration account for the Flipr platform.
/// 
/// PDA seeds: ["config"]
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Admin authority who can update config and pause the platform
    pub admin: Pubkey,

    /// Address that receives platform fees
    pub fee_recipient: Pubkey,

    /// Native SOL or wSOL token mint
    pub token_mint: Pubkey,

    /// LP share token mint (minted to LPs on deposit)
    pub lp_mint: Pubkey,

    /// Pyth SOL/USD price feed ID (32 bytes)
    pub pyth_feed_id: [u8; 32],

    /// Platform fee in basis points (e.g., 2000 = 20%)
    pub platform_fee_bps: u16,

    /// LP share of losses in basis points (e.g., 8000 = 80%)
    pub lp_fee_bps: u16,

    /// Minimum bet amount in lamports
    pub min_bet: u64,

    /// Maximum bet amount in lamports
    pub max_bet: u64,

    /// Price row width in cents (e.g., 100 = $0.01)
    pub row_width: u64,

    /// Number of slots until bet resolves (~30 slots = 12 seconds)
    pub resolution_slots: u64,

    /// Whether betting is currently paused
    pub paused: bool,

    /// Total number of bets placed
    pub total_bets: u64,

    /// Total betting volume in lamports
    pub total_volume: u64,

    /// PDA bump seed
    pub bump: u8,
}

impl Config {
    /// Validates that fee configuration is correct
    pub fn validate_fees(&self) -> bool {
        self.platform_fee_bps + self.lp_fee_bps == 10000
    }

    /// Validates bet limits
    pub fn validate_bet_limits(&self) -> bool {
        self.min_bet > 0 && self.max_bet > self.min_bet
    }
}
