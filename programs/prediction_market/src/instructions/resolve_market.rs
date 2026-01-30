use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

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

    /// Pyth price update account (optional - only needed if market uses Pyth oracle)
    /// CHECK: Validated in handler if market.pyth_price_feed_id is Some
    pub price_update: Option<Account<'info, PriceUpdateV2>>,
}

pub fn handler(
    ctx: Context<ResolveMarket>,
    _market_id: u64,
    winning_outcome: Outcome, // Only used if manual resolution (pyth_price_feed_id is None)
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

    // Determine winning outcome
    let final_outcome = if let Some(feed_id) = market.pyth_price_feed_id {
        // Pyth oracle-based resolution
        require!(
            ctx.accounts.price_update.is_some(),
            PredictionMarketError::PythPriceUpdateRequired
        );

        let price_update = ctx.accounts.price_update.as_ref().unwrap();
        
        // Maximum age for price update (30 seconds)
        let maximum_age: u64 = 30;
        
        // Get price from Pyth price update account
        // This will fail if:
        // - Price update is older than maximum_age
        // - Price feed ID doesn't match
        let price = price_update.get_price_no_older_than(
            &clock,
            maximum_age,
            &feed_id,
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

        msg!("Pyth oracle resolution:");
        msg!("  Price feed ID: {:?}", feed_id);
        msg!("  Current price: ({} ± {}) * 10^{}", price.price, price.conf, price.exponent);
        msg!("  Price threshold: {:?}", market.price_threshold);

        // Compare price to threshold
        if let Some(threshold) = market.price_threshold {
            // If price >= threshold, YES wins; else NO wins
            let outcome = if price.price >= threshold {
                Outcome::Yes
            } else {
                Outcome::No
            };
            msg!("  Price {} threshold -> Outcome: {:?}", 
                 if price.price >= threshold { ">=" } else { "<" }, 
                 outcome);
            outcome
        } else {
            return Err(PredictionMarketError::InvalidOutcome.into());
        }
    } else {
        // Manual resolution (backward compatible)
        require!(
            winning_outcome == Outcome::Yes || winning_outcome == Outcome::No,
            PredictionMarketError::InvalidOutcome
        );
        msg!("Manual resolution: {:?}", winning_outcome);
        winning_outcome
    };

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
