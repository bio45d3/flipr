# Risk.lol Clone - Technical Architecture & Build Plan

## Executive Summary

This document outlines the architecture for building a Solana-based price prediction betting platform similar to risk.lol. The system uses Pyth Network oracle for SOL/USD price feeds and implements a parimutuel betting model with LP vault for liquidity.

---

## 1. System Overview

### 1.1 Core Concept
- **Grid-based price prediction**: Users bet that SOL/USD price will reach a specific row within ~12 seconds (30 Solana slots)
- **Binary outcome**: Price either hits the target row or doesn't
- **No RNG needed**: Outcome is deterministic based on Pyth oracle price
- **LP-backed liquidity**: House bankroll provided by liquidity providers

### 1.2 Key Differentiators from Traditional Gambling
- **Provably fair**: Pyth oracle prices are verifiable on-chain
- **No randomness manipulation**: Outcome depends solely on market price
- **Transparent odds**: Multipliers are calculated from distance to current price

---

## 2. Architecture Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  Next.js + React + TailwindCSS + @solana/web3.js + Anchor Client    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SOLANA MAINNET                                │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  Prediction     │    │   LP Vault      │    │   Pyth Oracle   │ │
│  │  Program        │◄──►│   (PDA)         │    │   SOL/USD Feed  │ │
│  │  (Anchor)       │    │                 │    │                 │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                      │                      │          │
│           ▼                      ▼                      ▼          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  Bet Accounts   │    │  LP Share       │    │  Price Update   │ │
│  │  (PDAs)         │    │  Token Mint     │    │  Account        │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Solana Program Architecture

### 3.1 Account Structure

#### Config Account (Global, single instance)
```rust
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,              // Admin authority
    pub fee_recipient: Pubkey,      // Platform fee destination
    pub token_mint: Pubkey,         // SOL or wSOL
    pub lp_mint: Pubkey,            // LP share token mint
    pub pyth_feed_id: [u8; 32],     // SOL/USD Pyth feed ID
    pub platform_fee_bps: u16,      // Platform fee (e.g., 2000 = 20%)
    pub lp_fee_bps: u16,            // LP share of losses (e.g., 8000 = 80%)
    pub min_bet: u64,               // Minimum bet amount
    pub max_bet: u64,               // Maximum bet amount
    pub row_width: u64,             // Price row width in cents (e.g., 100 = $0.01)
    pub resolution_slots: u64,      // Slots until bet resolves (~30 = 12 seconds)
    pub paused: bool,
    pub total_bets: u64,
    pub total_volume: u64,
    pub bump: u8,
}

// PDA: seeds = [b"config"]
```

#### LP Vault Account
```rust
#[account]
#[derive(InitSpace)]
pub struct LpVault {
    pub total_assets: u64,          // Total SOL in vault
    pub total_shares: u64,          // Total LP shares minted
    pub outstanding_liability: u64,  // Potential payouts for active bets
    pub bump: u8,
    pub vault_bump: u8,
}

// PDA: seeds = [b"lp_vault"]
// Token Account PDA: seeds = [b"lp_vault_tokens"]
```

#### Bet Account (per active bet)
```rust
#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub bettor: Pubkey,
    pub amount: u64,
    pub target_price: u64,          // Target price row (in cents * 100)
    pub strike_price: u64,          // Price at bet placement
    pub multiplier: u64,            // Payout multiplier (scaled by 10000)
    pub max_payout: u64,            // Pre-calculated max payout
    pub placed_slot: u64,           // Slot when bet was placed
    pub resolution_slot: u64,       // Slot when bet resolves
    pub status: BetStatus,          // Active, Won, Lost, Expired
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetStatus {
    Active,
    Won,
    Lost,
    Expired,
}

// PDA: seeds = [b"bet", bettor.key(), bet_id.to_le_bytes()]
```

### 3.2 Instructions

```rust
#[program]
pub mod price_prediction {
    // === Admin Instructions ===
    
    /// Initialize the program config and LP vault
    pub fn initialize(
        ctx: Context<Initialize>,
        platform_fee_bps: u16,
        lp_fee_bps: u16,
        min_bet: u64,
        max_bet: u64,
        row_width: u64,
        resolution_slots: u64,
    ) -> Result<()>;
    
    /// Update config parameters
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_params: ConfigParams,
    ) -> Result<()>;
    
    /// Pause/unpause betting
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()>;
    
    // === LP Instructions ===
    
    /// Deposit SOL and receive LP shares
    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>,
        amount: u64,
    ) -> Result<()>;
    
    /// Burn LP shares and withdraw SOL
    pub fn withdraw_liquidity(
        ctx: Context<WithdrawLiquidity>,
        shares: u64,
    ) -> Result<()>;
    
    // === Betting Instructions ===
    
    /// Place a bet on a price row
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        target_price: u64,
        amount: u64,
    ) -> Result<()>;
    
    /// Resolve a bet (can be called by anyone after resolution_slot)
    pub fn resolve_bet(ctx: Context<ResolveBet>) -> Result<()>;
    
    /// Cancel expired bet and refund
    pub fn cancel_expired_bet(ctx: Context<CancelBet>) -> Result<()>;
}
```

### 3.3 Multiplier Calculation

```rust
/// Calculate multiplier based on distance from current price
/// Closer = lower multiplier, farther = higher multiplier
pub fn calculate_multiplier(
    current_price: u64,
    target_price: u64,
    row_width: u64,
) -> u64 {
    let distance = if target_price > current_price {
        target_price - current_price
    } else {
        current_price - target_price
    };
    
    let rows_away = distance / row_width;
    
    // Base multiplier calculation
    // Row 0 (current): 1.05x
    // Row 1: 1.29x
    // Row 2: 1.65x
    // Row 3+: exponential increase
    
    match rows_away {
        0 => 10500,      // 1.05x
        1 => 12900,      // 1.29x
        2 => 16500,      // 1.65x
        3 => 20800,      // 2.08x
        4 => 25700,      // 2.57x
        5 => 30800,      // 3.08x
        _ => 30800 + (rows_away - 5) * 5000, // +0.5x per row after 5
    }
}
```

---

## 4. Pyth Oracle Integration

### 4.1 Dependencies
```toml
[dependencies]
pyth-solana-receiver-sdk = "0.4"
anchor-lang = "0.31"
anchor-spl = "0.31"
```

### 4.2 Price Feed Integration
```rust
use pyth_solana_receiver_sdk::price_update::{
    get_feed_id_from_hex, 
    PriceUpdateV2
};

// SOL/USD Feed ID (mainnet)
pub const SOL_USD_FEED_ID: &str = 
    "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

// Maximum price age in seconds
pub const MAX_PRICE_AGE: u64 = 30;

pub fn get_sol_price(
    price_update: &Account<'_, PriceUpdateV2>,
) -> Result<u64> {
    let clock = Clock::get()?;
    let feed_id = get_feed_id_from_hex(SOL_USD_FEED_ID)?;
    
    let price = price_update.get_price_no_older_than(
        &clock,
        MAX_PRICE_AGE,
        &feed_id,
    )?;
    
    // Convert to cents (price has negative exponent)
    // price.price is i64, price.exponent is i32 (typically -8)
    let price_in_cents = (price.price as u64)
        .checked_mul(100)
        .ok_or(PredictionError::Overflow)?
        .checked_div(10u64.pow((-price.exponent) as u32))
        .ok_or(PredictionError::Overflow)?;
    
    Ok(price_in_cents)
}
```

### 4.3 Bet Resolution Logic
```rust
pub fn resolve_bet(ctx: Context<ResolveBet>) -> Result<()> {
    let bet = &mut ctx.accounts.bet;
    let vault = &mut ctx.accounts.lp_vault;
    let config = &ctx.accounts.config;
    
    // Verify bet can be resolved
    let clock = Clock::get()?;
    require!(
        clock.slot >= bet.resolution_slot,
        PredictionError::BetNotResolvable
    );
    require!(
        bet.status == BetStatus::Active,
        PredictionError::BetAlreadyResolved
    );
    
    // Get current price from Pyth
    let current_price = get_sol_price(&ctx.accounts.price_update)?;
    
    // Check if price hit target row at any point
    // Target row is ±$0.005 (half row width) of target_price
    let row_half_width = config.row_width / 2;
    let row_min = bet.target_price.saturating_sub(row_half_width);
    let row_max = bet.target_price.saturating_add(row_half_width);
    
    let won = current_price >= row_min && current_price <= row_max;
    
    if won {
        bet.status = BetStatus::Won;
        
        // Calculate payout
        let payout = bet.amount
            .checked_mul(bet.multiplier)
            .ok_or(PredictionError::Overflow)?
            .checked_div(10000)
            .ok_or(PredictionError::Overflow)?;
        
        // Transfer winnings to bettor
        // ... CPI to transfer from vault
        
        // Update vault
        vault.total_assets = vault.total_assets
            .checked_sub(payout - bet.amount)
            .ok_or(PredictionError::InsufficientLiquidity)?;
        vault.outstanding_liability = vault.outstanding_liability
            .checked_sub(bet.max_payout)
            .ok_or(PredictionError::Overflow)?;
    } else {
        bet.status = BetStatus::Lost;
        
        // Distribute losses: 80% to LP, 20% to platform
        let lp_share = bet.amount
            .checked_mul(config.lp_fee_bps as u64)
            .ok_or(PredictionError::Overflow)?
            .checked_div(10000)
            .ok_or(PredictionError::Overflow)?;
        
        let platform_share = bet.amount - lp_share;
        
        // LP share stays in vault (already there)
        vault.total_assets = vault.total_assets
            .checked_add(lp_share)
            .ok_or(PredictionError::Overflow)?;
        vault.outstanding_liability = vault.outstanding_liability
            .checked_sub(bet.max_payout)
            .ok_or(PredictionError::Overflow)?;
        
        // Transfer platform share
        // ... CPI to transfer to fee_recipient
    }
    
    Ok(())
}
```

---

## 5. Frontend Architecture

### 5.1 Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Styling**: TailwindCSS
- **State**: Zustand or Jotai
- **Solana**: @solana/web3.js, @coral-xyz/anchor
- **Wallet**: @solana/wallet-adapter-react
- **Price Feed**: @pythnetwork/hermes-client

### 5.2 Key Components

```
src/
├── app/
│   ├── page.tsx              # Main betting grid
│   ├── layout.tsx            # Wallet provider, theme
│   └── lp/
│       └── page.tsx          # LP deposit/withdraw UI
├── components/
│   ├── BettingGrid.tsx       # Price row grid visualization
│   ├── BetPanel.tsx          # Bet amount selection
│   ├── PriceDisplay.tsx      # Real-time SOL/USD price
│   ├── ActiveBets.tsx        # User's active bets
│   ├── WalletButton.tsx      # Connect wallet
│   └── LPVault.tsx           # LP stats and actions
├── hooks/
│   ├── usePythPrice.ts       # Real-time price subscription
│   ├── useProgram.ts         # Anchor program instance
│   ├── useBets.ts            # User bet management
│   └── useVault.ts           # LP vault state
├── lib/
│   ├── program.ts            # Program IDL and setup
│   ├── constants.ts          # Addresses, config
│   └── utils.ts              # Helpers
└── types/
    └── index.ts              # TypeScript types
```

### 5.3 Real-Time Price Feed

```typescript
// hooks/usePythPrice.ts
import { HermesClient } from "@pythnetwork/hermes-client";
import { useEffect, useState } from "react";

const SOL_USD_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

export function usePythPrice() {
  const [price, setPrice] = useState<number | null>(null);
  
  useEffect(() => {
    const client = new HermesClient("https://hermes.pyth.network");
    
    // Subscribe to price updates
    const unsubscribe = client.subscribePriceFeedUpdates(
      [SOL_USD_FEED_ID],
      (update) => {
        const price = update.price;
        const normalizedPrice = Number(price.price) * Math.pow(10, price.expo);
        setPrice(normalizedPrice);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  return price;
}
```

### 5.4 Betting Grid Component

```typescript
// components/BettingGrid.tsx
export function BettingGrid({ 
  currentPrice, 
  onSelectRow 
}: BettingGridProps) {
  const rows = useMemo(() => {
    if (!currentPrice) return [];
    
    const ROW_WIDTH = 0.01; // $0.01 per row
    const ROWS_ABOVE = 10;
    const ROWS_BELOW = 10;
    
    const centerRow = Math.round(currentPrice / ROW_WIDTH) * ROW_WIDTH;
    
    return Array.from({ length: ROWS_ABOVE + ROWS_BELOW + 1 }, (_, i) => {
      const rowPrice = centerRow + (ROWS_ABOVE - i) * ROW_WIDTH;
      const distance = Math.abs(rowPrice - currentPrice);
      const rowsAway = Math.round(distance / ROW_WIDTH);
      const multiplier = calculateMultiplier(rowsAway);
      
      return {
        price: rowPrice,
        multiplier,
        isCurrentRow: rowsAway === 0,
      };
    });
  }, [currentPrice]);
  
  return (
    <div className="grid gap-1">
      {rows.map((row) => (
        <GridRow
          key={row.price}
          price={row.price}
          multiplier={row.multiplier}
          isCurrentRow={row.isCurrentRow}
          onClick={() => onSelectRow(row.price)}
        />
      ))}
    </div>
  );
}
```

---

## 6. Development Phases

### Phase 1: Core Program (Week 1-2)
- [ ] Project setup (Anchor workspace)
- [ ] Config and LP Vault accounts
- [ ] Initialize instruction
- [ ] LP deposit/withdraw instructions
- [ ] Basic bet placement
- [ ] Unit tests for all instructions

### Phase 2: Pyth Integration (Week 2)
- [ ] Integrate pyth-solana-receiver-sdk
- [ ] Price fetch helpers
- [ ] Bet resolution with price verification
- [ ] Edge case handling (stale prices, etc.)
- [ ] Integration tests with devnet Pyth

### Phase 3: Frontend MVP (Week 3)
- [ ] Next.js project setup
- [ ] Wallet connection
- [ ] Real-time price display
- [ ] Betting grid UI
- [ ] Bet placement flow
- [ ] Active bets display

### Phase 4: LP & Polish (Week 4)
- [ ] LP vault UI
- [ ] Transaction history
- [ ] Error handling & loading states
- [ ] Mobile responsiveness
- [ ] Performance optimization

### Phase 5: Testing & Security (Week 5)
- [ ] Comprehensive test suite (48+ tests)
- [ ] Security checklist review
- [ ] Devnet deployment
- [ ] Beta testing
- [ ] Bug fixes

### Phase 6: Mainnet Launch (Week 6)
- [ ] Security audit (optional but recommended)
- [ ] Mainnet program deployment
- [ ] Production frontend deployment
- [ ] Monitoring setup
- [ ] Documentation

---

## 7. Security Considerations

### 7.1 Critical Checks
Based on Solana security best practices:

1. **Signer Validation**
   - All admin functions check `admin.key() == config.admin`
   - Use `Signer<'info>` type for authentication

2. **Account Ownership**
   - Validate all accounts are owned by expected programs
   - Use Anchor's `Account<'info, T>` for automatic checks

3. **Integer Safety**
   - Use `checked_add`, `checked_sub`, `checked_mul`, `checked_div`
   - Enable `overflow-checks = true` in Cargo.toml

4. **PDA Security**
   - Include user pubkey in bet PDA seeds
   - Store and verify canonical bumps

5. **Price Oracle**
   - Validate price age (max 30 seconds)
   - Check price confidence interval
   - Handle stale price gracefully

6. **LP Vault Protection**
   - Track outstanding liability
   - Prevent over-leveraged positions
   - Implement withdrawal cooldowns (optional)

### 7.2 Security Checklist
```
[ ] All instructions have proper signer checks
[ ] All accounts validated for ownership
[ ] Integer overflow protection enabled
[ ] PDA seeds include user differentiation
[ ] Pyth price age validated
[ ] LP vault has liability tracking
[ ] No CPI to user-provided programs
[ ] All token accounts validated for mint
[ ] Emergency pause functionality
[ ] Admin transfer uses two-step pattern
```

---

## 8. Optional Enhancements

### 8.1 MagicBlock Integration (Future)
For sub-50ms latency:
- Ephemeral rollups for bet placement
- Settlement still on mainnet
- Requires MagicBlock SDK integration

### 8.2 Additional Features
- Bet history tracking
- Leaderboard
- Referral system
- Multiple token support (USDC)
- Limit orders (bet when price reaches X)

---

## 9. Resource Links

### Documentation
- [Anchor Framework](https://www.anchor-lang.com/docs)
- [Pyth Solana SDK](https://docs.pyth.network/price-feeds/core/use-real-time-data/pull-integration/solana)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token](https://spl.solana.com/token)

### Examples
- [Pyth SendUSD Demo](https://github.com/pyth-network/pyth-examples/tree/main/price_feeds/solana/send_usd)
- [Anchor Escrow](https://github.com/coral-xyz/anchor/tree/master/examples/escrow)
- [Prediction Market Example](https://github.com/SivaramPg/solana-simple-prediction-market-contract)

### Security
- [Solana Security Checklist](https://www.zealynx.io/blogs/solana-security-checklist)
- [Helius Security Guide](https://www.helius.dev/blog/a-hitchhikers-guide-to-solana-program-security)

---

## 10. Cost Estimates

### Development
- Solana devnet: Free (test SOL via faucet)
- Mainnet deployment: ~1-2 SOL
- Initial LP seed: Your choice

### Ongoing
- Transaction fees: ~0.000005 SOL per tx
- Rent for accounts: ~0.002 SOL per bet account
- Hermes API: Free tier available

---

## Next Steps

1. **Create Anchor project**: `anchor init price-prediction`
2. **Implement Config & LP Vault**: Start with account structures
3. **Add Pyth integration**: Test price fetching on devnet
4. **Build betting logic**: Place bet → Resolve bet flow
5. **Frontend development**: Parallel to program testing

Ready to start building? Let me know which phase to begin with.

---

## MagicBlock Integration

### Why MagicBlock?
- **Ephemeral Rollups**: Near-instant bet placement (no waiting for Solana block times)
- **Session Keys**: Users don't need to sign every bet transaction
- **Used by risk.lol**: Proven for this exact use case

### Ephemeral Validator Endpoints
- Mainnet EU: `eu.magicblock.app` (MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e)
- Mainnet US: `us.magicblock.app` (MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd)
- Devnet EU: `devnet-eu.magicblock.app`

### Integration Flow
1. User connects wallet
2. Create session key (one-time signature)
3. Bet placement → delegate to MagicBlock ephemeral validator
4. Fast confirmation (~100ms vs ~400ms)
5. Settlement → commits back to mainnet Solana

### NPM Packages
- `@magicblock-labs/bolt-sdk` — TypeScript client
- `@magicblock-labs/ephemeral-rollups-sdk` — Ephemeral rollup integration

### Resources
- Docs: https://docs.magicblock.gg
- GitHub: https://github.com/magicblock-labs
