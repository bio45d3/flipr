use anchor_lang::prelude::*;

#[error_code]
pub enum FliprError {
    // === Authorization Errors ===
    #[msg("Unauthorized: caller is not the admin")]
    Unauthorized,

    #[msg("Invalid admin pubkey provided")]
    InvalidAdmin,

    // === Config Errors ===
    #[msg("Platform is currently paused")]
    PlatformPaused,

    #[msg("Invalid fee configuration: fees must sum to 10000 bps")]
    InvalidFeeConfig,

    #[msg("Invalid bet limits: min must be less than max")]
    InvalidBetLimits,

    #[msg("Invalid row width: must be greater than 0")]
    InvalidRowWidth,

    #[msg("Invalid resolution slots: must be greater than 0")]
    InvalidResolutionSlots,

    // === Betting Errors ===
    #[msg("Bet amount is below minimum")]
    BetTooSmall,

    #[msg("Bet amount exceeds maximum")]
    BetTooLarge,

    #[msg("Bet is not yet resolvable")]
    BetNotResolvable,

    #[msg("Bet has already been resolved")]
    BetAlreadyResolved,

    #[msg("Bet is not active")]
    BetNotActive,

    #[msg("Bet has expired and cannot be resolved")]
    BetExpired,

    #[msg("Invalid target price")]
    InvalidTargetPrice,

    // === Vault Errors ===
    #[msg("Insufficient liquidity in vault")]
    InsufficientLiquidity,

    #[msg("Insufficient LP shares for withdrawal")]
    InsufficientShares,

    #[msg("Deposit amount must be greater than 0")]
    InvalidDepositAmount,

    #[msg("Withdrawal amount must be greater than 0")]
    InvalidWithdrawalAmount,

    #[msg("Outstanding liability too high for this bet")]
    LiabilityTooHigh,

    // === Price Oracle Errors ===
    #[msg("Price feed is stale (older than max age)")]
    StalePriceFeed,

    #[msg("Invalid price feed ID")]
    InvalidPriceFeed,

    #[msg("Failed to fetch price from oracle")]
    PriceFetchFailed,

    #[msg("Price confidence interval too wide")]
    PriceConfidenceTooWide,

    // === Math Errors ===
    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Arithmetic underflow")]
    Underflow,

    #[msg("Division by zero")]
    DivisionByZero,

    // === Account Errors ===
    #[msg("Account already initialized")]
    AlreadyInitialized,

    #[msg("Invalid account owner")]
    InvalidAccountOwner,

    #[msg("Invalid mint")]
    InvalidMint,

    #[msg("Bump seed not found")]
    BumpNotFound,
}
