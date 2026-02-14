use anchor_lang::prelude::*;

#[error_code]
pub enum PredictionMarketError {
    #[msg("Contract is paused")]
    Paused,
    #[msg("Contract is not paused")]
    NotPaused,
    #[msg("Invalid admin")]
    InvalidAdmin,
    #[msg("Creator not authorized to create markets")]
    UnauthorizedCreator,
    #[msg("Invalid fee percentage")]
    InvalidFee,
    #[msg("Fee recipient must be a regular wallet (system account), not a PDA")]
    InvalidFeeRecipient,
    #[msg("Invalid resolution time")]
    InvalidResolutionTime,
    #[msg("Empty question")]
    EmptyQuestion,
    #[msg("Question too long")]
    QuestionTooLong,
    #[msg("Market not found")]
    MarketNotFound,
    #[msg("Market not active")]
    MarketNotActive,
    #[msg("Market already finalized")]
    MarketAlreadyFinalized,
    #[msg("Market not finalized")]
    MarketNotFinalized,
    #[msg("Market expired")]
    MarketExpired,
    #[msg("Market not expired")]
    MarketNotExpired,
    #[msg("Invalid outcome")]
    InvalidOutcome,
    #[msg("No opposition in market")]
    NoOpposition,
    #[msg("Zero amount")]
    ZeroAmount,
    #[msg("No position")]
    NoPosition,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Overflow error")]
    Overflow,
    #[msg("User has already committed in this market")]
    AlreadyCommitted,
    #[msg("User has not committed in this market")]
    NotCommitted,
    #[msg("User has already revealed in this market")]
    AlreadyRevealed,
    #[msg("Invalid commitment reveal data")]
    InvalidCommitment,
    #[msg("Reveal deadline has passed")]
    RevealDeadlineExpired,
    #[msg("Reveal deadline has not passed yet")]
    RevealDeadlineNotPassed,
    #[msg("No unrevealed stakes to forfeit")]
    NoUnrevealedStakes,
    #[msg("Pyth price update account required for oracle-based markets")]
    PythPriceUpdateRequired,
    #[msg("Pyth price update is too old")]
    PythPriceTooOld,
    #[msg("Pyth price feed ID mismatch")]
    PythFeedIdMismatch,
}
