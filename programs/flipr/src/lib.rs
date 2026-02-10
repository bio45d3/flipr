use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use error::*;
pub use state::*;

declare_id!("BERkt82D2qELZ15fyFBXdHRSFBxoyxrdsf76tzzaeFu6");

#[program]
pub mod flipr {
    use super::*;

    /// Initialize the Flipr platform with config and LP vault.
    /// Can only be called once by the initial admin.
    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee_bps: u16,
        lp_fee_bps: u16,
        min_bet: u64,
        max_bet: u64,
        row_width: u64,
        resolution_slots: u64,
    ) -> Result<()> {
        // Validate fee configuration
        require!(
            platform_fee_bps + lp_fee_bps == 10000,
            FliprError::InvalidFeeConfig
        );
        require!(min_bet > 0 && max_bet > min_bet, FliprError::InvalidBetLimits);
        require!(row_width > 0, FliprError::InvalidRowWidth);
        require!(resolution_slots > 0, FliprError::InvalidResolutionSlots);

        // Initialize config
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.fee_recipient = ctx.accounts.admin.key(); // Default to admin
        config.token_mint = Pubkey::default(); // Native SOL
        config.lp_mint = Pubkey::default(); // Will be set when LP mint is created
        config.pyth_feed_id = [0u8; 32]; // Will be set via update_config
        config.platform_fee_bps = platform_fee_bps;
        config.lp_fee_bps = lp_fee_bps;
        config.min_bet = min_bet;
        config.max_bet = max_bet;
        config.row_width = row_width;
        config.resolution_slots = resolution_slots;
        config.paused = false;
        config.total_bets = 0;
        config.total_volume = 0;
        config.bump = ctx.bumps.config;

        // Initialize LP vault
        let vault = &mut ctx.accounts.lp_vault;
        vault.total_assets = 0;
        vault.total_shares = 0;
        vault.outstanding_liability = 0;
        vault.bump = ctx.bumps.lp_vault;
        vault.vault_bump = 0; // Will be set when token vault is created

        msg!("Flipr platform initialized!");
        msg!("Admin: {}", config.admin);
        msg!("Platform fee: {} bps, LP fee: {} bps", platform_fee_bps, lp_fee_bps);

        Ok(())
    }

    /// Update configuration parameters. Admin only.
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_fee_recipient: Option<Pubkey>,
        new_platform_fee_bps: Option<u16>,
        new_lp_fee_bps: Option<u16>,
        new_min_bet: Option<u64>,
        new_max_bet: Option<u64>,
        new_row_width: Option<u64>,
        new_resolution_slots: Option<u64>,
        new_pyth_feed_id: Option<[u8; 32]>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if let Some(fee_recipient) = new_fee_recipient {
            config.fee_recipient = fee_recipient;
        }

        if let (Some(platform_fee), Some(lp_fee)) = (new_platform_fee_bps, new_lp_fee_bps) {
            require!(platform_fee + lp_fee == 10000, FliprError::InvalidFeeConfig);
            config.platform_fee_bps = platform_fee;
            config.lp_fee_bps = lp_fee;
        }

        if let Some(min_bet) = new_min_bet {
            config.min_bet = min_bet;
        }

        if let Some(max_bet) = new_max_bet {
            config.max_bet = max_bet;
        }

        if let Some(row_width) = new_row_width {
            require!(row_width > 0, FliprError::InvalidRowWidth);
            config.row_width = row_width;
        }

        if let Some(resolution_slots) = new_resolution_slots {
            require!(resolution_slots > 0, FliprError::InvalidResolutionSlots);
            config.resolution_slots = resolution_slots;
        }

        if let Some(pyth_feed_id) = new_pyth_feed_id {
            config.pyth_feed_id = pyth_feed_id;
        }

        // Validate bet limits
        require!(
            config.min_bet > 0 && config.max_bet > config.min_bet,
            FliprError::InvalidBetLimits
        );

        msg!("Config updated!");
        Ok(())
    }

    /// Pause or unpause the platform. Admin only.
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.paused = paused;
        
        msg!("Platform paused: {}", paused);
        Ok(())
    }
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = admin,
        space = 8 + LpVault::INIT_SPACE,
        seeds = [LP_VAULT_SEED],
        bump
    )]
    pub lp_vault: Account<'info, LpVault>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        constraint = admin.key() == config.admin @ FliprError::Unauthorized
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        constraint = admin.key() == config.admin @ FliprError::Unauthorized
    )]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
}
