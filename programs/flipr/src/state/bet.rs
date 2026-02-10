use anchor_lang::prelude::*;

/// Individual bet account created per active bet.
/// 
/// PDA seeds: ["bet", bettor_pubkey, bet_id_bytes]
#[account]
#[derive(InitSpace)]
pub struct Bet {
    /// The bettor's public key
    pub bettor: Pubkey,

    /// Bet amount in lamports
    pub amount: u64,

    /// Target price row (in cents * 100, e.g., 12345 = $123.45)
    pub target_price: u64,

    /// Strike price at bet placement (in cents * 100)
    pub strike_price: u64,

    /// Payout multiplier (scaled by 10000, e.g., 15000 = 1.5x)
    pub multiplier: u64,

    /// Pre-calculated maximum payout (amount * multiplier / 10000)
    pub max_payout: u64,

    /// Slot when the bet was placed
    pub placed_slot: u64,

    /// Slot when the bet can be resolved
    pub resolution_slot: u64,

    /// Current status of the bet
    pub status: BetStatus,

    /// Unique bet ID for this bettor
    pub bet_id: u64,

    /// PDA bump seed
    pub bump: u8,
}

/// Status of a bet
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum BetStatus {
    /// Bet is active and waiting for resolution
    Active,
    /// Bet won - price hit target row
    Won,
    /// Bet lost - price did not hit target row
    Lost,
    /// Bet expired - resolution window passed
    Expired,
}

impl Default for BetStatus {
    fn default() -> Self {
        BetStatus::Active
    }
}

impl Bet {
    /// Check if the bet is still active
    pub fn is_active(&self) -> bool {
        self.status == BetStatus::Active
    }

    /// Check if the bet can be resolved at the given slot
    pub fn can_resolve(&self, current_slot: u64) -> bool {
        self.is_active() && current_slot >= self.resolution_slot
    }

    /// Check if the target price row was hit.
    /// Target row is ±half row_width of target_price.
    pub fn check_win(&self, current_price: u64, row_width: u64) -> bool {
        let row_half_width = row_width / 2;
        let row_min = self.target_price.saturating_sub(row_half_width);
        let row_max = self.target_price.saturating_add(row_half_width);
        
        current_price >= row_min && current_price <= row_max
    }
}

impl std::fmt::Display for BetStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BetStatus::Active => write!(f, "Active"),
            BetStatus::Won => write!(f, "Won"),
            BetStatus::Lost => write!(f, "Lost"),
            BetStatus::Expired => write!(f, "Expired"),
        }
    }
}
