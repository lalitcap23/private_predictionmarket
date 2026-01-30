use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

use crate::constants::SOL_USD_FEED_ID;
use crate::error::PredictionMarketError;
use crate::state::{Config, Market, MarketState, Outcome};

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct ResolveMarket<'info> {
    #[account(
        constraint = admin.key() == config.admin @ PredictionMarketError::InvalidAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [Config::SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [Market::SEED, market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.state == MarketState::Active @ PredictionMarketError::MarketAlreadyFinalized
    )]
    pub market: Account<'info, Market>,

    /// Pyth price update account for SOL/USD feed
    /// CHECK: Validated in handler - must be a valid PriceUpdateV2 for SOL/USD
    pub price_update: Account<'info, PriceUpdateV2>,
}

pub fn handler(
    ctx: Context<ResolveMarket>,
    _market_id: u64,
    _winning_outcome: Outcome, // Not used - all markets use Pyth oracle
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;

    // Validations
    require!(
        clock.unix_timestamp >= market.resolution_time,
        PredictionMarketError::MarketNotExpired
    );

    // Check for opposition (only for legacy markets, commit-reveal doesn't use pools)
    // This check can be removed or made optional for commit-reveal markets
    // require!(
    //     market.yes_pool > 0 && market.no_pool > 0,
    //     PredictionMarketError::NoOpposition
    // );

    // All markets use Pyth oracle for SOL/USD price resolution
    let price_update = &ctx.accounts.price_update;
    
    // Maximum age for price update (30 seconds)
    let maximum_age: u64 = 30;
    
    // Get price from Pyth price update account using hardcoded SOL/USD feed ID
    // This will fail if:
    // - Price update is older than maximum_age
    // - Price feed ID doesn't match SOL/USD feed
    let price = price_update.get_price_no_older_than(
        &clock,
        maximum_age,
        &SOL_USD_FEED_ID,
    ).map_err(|e| {
        msg!("Pyth price fetch error: {:?}", e);
        if e.to_string().contains("too old") {
            PredictionMarketError::PythPriceTooOld
        } else if e.to_string().contains("feed") {
            PredictionMarketError::PythFeedIdMismatch
        } else {
            PredictionMarketError::InvalidOutcome
        }
    })?;

    msg!("Pyth oracle resolution (SOL/USD):");
    msg!("  Price feed ID: {:?}", SOL_USD_FEED_ID);
    msg!("  Current price: ({} ± {}) * 10^{}", price.price, price.conf, price.exponent);
    
    // Get threshold from market
    let threshold = market.price_threshold.ok_or(PredictionMarketError::InvalidOutcome)?;
    msg!("  Price threshold: {}", threshold);

    // Compare price to threshold
    // If price >= threshold, YES wins; else NO wins
    let final_outcome = if price.price >= threshold {
        Outcome::Yes
    } else {
        Outcome::No
    };
    
    msg!("  SOL price {} threshold -> Outcome: {:?}", 
         if price.price >= threshold { ">=" } else { "<" }, 
         final_outcome);

    // Resolve market
    market.state = MarketState::Resolved;
    market.winning_outcome = final_outcome;
    
    // Set reveal deadline: 2 weeks (14 days) after resolution time
    // 14 days = 14 * 24 * 60 * 60 = 1,209,600 seconds
    const TWO_WEEKS_SECONDS: i64 = 14 * 24 * 60 * 60;
    market.reveal_deadline = market.resolution_time
        .checked_add(TWO_WEEKS_SECONDS)
        .ok_or(PredictionMarketError::Overflow)?;

    msg!("Market resolved");
    msg!("Market ID: {}", market.id);
    msg!("Winning Outcome: {:?}", final_outcome);
    msg!("Reveal Deadline: {}", market.reveal_deadline);
    msg!("YES Pool: {}", market.yes_pool);
    msg!("NO Pool: {}", market.no_pool);

    Ok(())
}
