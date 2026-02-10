use anchor_lang::prelude::*;

/// LP Vault account that holds liquidity for the platform.
/// 
/// PDA seeds: ["lp_vault"]
/// Token account PDA seeds: ["lp_vault_tokens"]
#[account]
#[derive(InitSpace)]
pub struct LpVault {
    /// Total SOL assets in the vault (in lamports)
    pub total_assets: u64,

    /// Total LP shares minted
    pub total_shares: u64,

    /// Outstanding liability (potential payouts for active bets)
    pub outstanding_liability: u64,

    /// PDA bump seed
    pub bump: u8,

    /// Token vault PDA bump seed
    pub vault_bump: u8,
}

impl LpVault {
    /// Calculate the number of shares to mint for a deposit amount.
    /// Uses the formula: shares = (deposit * total_shares) / total_assets
    /// For the first deposit, shares = deposit amount
    pub fn calculate_shares_for_deposit(&self, deposit_amount: u64) -> Option<u64> {
        if self.total_shares == 0 || self.total_assets == 0 {
            // First deposit: 1:1 ratio
            Some(deposit_amount)
        } else {
            // Calculate proportional shares
            let shares = (deposit_amount as u128)
                .checked_mul(self.total_shares as u128)?
                .checked_div(self.total_assets as u128)?;
            Some(shares as u64)
        }
    }

    /// Calculate the amount of assets to return for burning shares.
    /// Uses the formula: assets = (shares * total_assets) / total_shares
    pub fn calculate_assets_for_withdrawal(&self, shares: u64) -> Option<u64> {
        if self.total_shares == 0 {
            return Some(0);
        }

        // Calculate available assets (total minus outstanding liability)
        let available_assets = self.total_assets.checked_sub(self.outstanding_liability)?;
        
        let assets = (shares as u128)
            .checked_mul(available_assets as u128)?
            .checked_div(self.total_shares as u128)?;
        Some(assets as u64)
    }

    /// Check if the vault has sufficient liquidity for a potential payout.
    pub fn has_sufficient_liquidity(&self, potential_payout: u64) -> bool {
        let new_liability = self.outstanding_liability.saturating_add(potential_payout);
        new_liability <= self.total_assets
    }

    /// Get the current share price (assets per share, scaled by 1e9)
    pub fn share_price(&self) -> Option<u64> {
        if self.total_shares == 0 {
            return Some(1_000_000_000); // 1:1 for empty vault
        }
        
        let price = (self.total_assets as u128)
            .checked_mul(1_000_000_000)?
            .checked_div(self.total_shares as u128)?;
        Some(price as u64)
    }
}
