use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::error::PredictionMarketError;
use crate::state::{Config, Market, MarketState, UserPosition};

/// Forfeit unrevealed stakes to protocol after reveal deadline has passed.
/// Admin-only instruction that transfers unrevealed committed stakes to protocol fee recipient.
#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct ForfeitUnrevealed<'info> {
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
        constraint = market.state == MarketState::Resolved @ PredictionMarketError::MarketNotFinalized
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [Market::VAULT_SEED, market_id.to_le_bytes().as_ref()],
        bump = market.vault_bump
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [UserPosition::SEED, market_id.to_le_bytes().as_ref(), user_to_forfeit.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.market_id == market_id @ PredictionMarketError::InvalidAdmin,
        constraint = user_position.committed_amount > 0 @ PredictionMarketError::NoPosition,
        constraint = !user_position.revealed @ PredictionMarketError::AlreadyRevealed,
        constraint = !user_position.claimed @ PredictionMarketError::AlreadyClaimed
    )]
    pub user_position: Account<'info, UserPosition>,

    /// User whose unrevealed stake is being forfeited
    /// CHECK: Validated via user_position.user
    pub user_to_forfeit: AccountInfo<'info>,

    /// Protocol fee recipient token account (receives forfeited stakes)
    #[account(
        mut,
        token::mint = market_vault.mint
    )]
    pub fee_recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ForfeitUnrevealed>, market_id: u64) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.user_position;
    let clock = Clock::get()?;

    // Ensure market is resolved
    require!(
        market.state == MarketState::Resolved,
        PredictionMarketError::MarketNotFinalized
    );

    // Ensure reveal deadline has passed
    require!(
        market.reveal_deadline > 0,
        PredictionMarketError::MarketNotFinalized
    );
    require!(
        clock.unix_timestamp > market.reveal_deadline,
        PredictionMarketError::RevealDeadlineNotPassed
    );

    // Ensure user hasn't revealed
    require!(
        !position.revealed,
        PredictionMarketError::AlreadyRevealed
    );

    // Ensure user hasn't already been forfeited/claimed
    require!(
        !position.claimed,
        PredictionMarketError::AlreadyClaimed
    );

    // Calculate forfeited amount (full committed amount goes to protocol)
    let forfeited_amount = position.committed_amount;

    // Mark position as claimed (forfeited) to prevent double-forfeiting
    position.claimed = true;
    // Mark as revealed with None outcome to indicate forfeiture
    position.revealed = true;
    position.revealed_outcome = crate::state::Outcome::None;

    // Transfer forfeited stakes to protocol fee recipient
    let market_id_bytes = market_id.to_le_bytes();
    let seeds = &[Market::SEED, market_id_bytes.as_ref(), &[market.bump]];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.market_vault.to_account_info(),
        to: ctx.accounts.fee_recipient_token_account.to_account_info(),
        authority: ctx.accounts.market.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    transfer(cpi_ctx, forfeited_amount)?;

    msg!("Unrevealed stake forfeited");
    msg!("Market ID: {}", market_id);
    msg!("User: {}", ctx.accounts.user_to_forfeit.key());
    msg!("Forfeited Amount: {}", forfeited_amount);
    msg!("Fee Recipient: {}", ctx.accounts.fee_recipient_token_account.key());

    Ok(())
}

