# Simple Binary Prediction Markets (Solana)

<div align="center">

![Rust](https://img.shields.io/badge/Rust-1.70+-orange)
![Anchor](https://img.shields.io/badge/Anchor-0.32-purple)
![Solana](https://img.shields.io/badge/Solana-1.18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Simple, educational prediction market program for Solana**

[Quick Start](#-quick-start) | [Documentation](#-documentation) | [Examples](#-usage-examples) | [Contributing](#-contributing)

</div>

---

> **DISCLAIMER: This project is for educational purposes only. This program is UNAUDITED and should NOT be used in production as-is. The authors are not responsible for any damages, losses, or liabilities that may arise from the use of this code. Always conduct your own security audits and due diligence before deploying any programs to mainnet.**

---

## Overview

Simple Binary Prediction Markets is an open-source implementation of pot-based binary prediction markets for Solana using the Anchor framework. Users bet on YES/NO outcomes, and winners share the losing pool proportionally.

### Key Features

- **Simple Pot-Based Model** - No token splitting, no orderbooks, just simple pools
- **Binary Markets** - YES/NO outcomes only
- **Manual Resolution** - Admin-controlled market resolution
- **SPL Token Support** - Use any SPL token for betting (USDC, etc.)
- **Config Snapshot** - Market configuration locked at creation
- **PDA-Based Accounts** - Secure, deterministic account addresses

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Prediction Market                        │
├─────────────────────────────────────────────────────────────┤
│  Market Creation → Betting → Resolution → Claiming         │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │   YES    │    │   NO     │    │  Winner  │             │
│  │  Pool    │    │  Pool    │    │ Takes    │             │
│  │          │    │          │    │  All     │             │
│  └──────────┘    └──────────┘    └──────────┘             │
│       └──────────────┴───────────────┘                    │
│              Proportional Distribution                     │
└─────────────────────────────────────────────────────────────┘
```

### Payout Formula

```
Winner Payout = User Bet + (User Bet / Winning Pool) × Losing Pool
```

---

## Quick Start

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.70+
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) 1.18+
- [Anchor](https://www.anchor-lang.com/docs/installation) 0.32+
- [Node.js](https://nodejs.org/) 18+
- [Yarn](https://yarnpkg.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-simple-prediction-market-contract.git
cd solana-simple-prediction-market-contract

# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test
```

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Airdrop some SOL for deployment
solana airdrop 2

# Deploy
anchor deploy --provider.cluster devnet
```

---

## Documentation

### Program Architecture

```
programs/prediction_market/src/
├── lib.rs              # Program entry point
├── constants.rs        # Constants (max fee, etc.)
├── error.rs            # Custom errors
├── state/
│   ├── config.rs       # Global config account
│   ├── market.rs       # Market account
│   └── user_position.rs # User position account
└── instructions/
    ├── initialize.rs   # Initialize program
    ├── update_config.rs # Update config (admin)
    ├── pause.rs        # Pause/unpause (admin)
    ├── create_market.rs # Create market
    ├── place_bet.rs    # Place bet
    ├── resolve_market.rs # Resolve market (admin)
    ├── cancel_market.rs # Cancel market (admin)
    └── claim_winnings.rs # Claim winnings
```

### Account Structure

#### Config (PDA)
```rust
pub struct Config {
    pub admin: Pubkey,           // Admin authority
    pub fee_recipient: Pubkey,   // Fee recipient
    pub token_mint: Pubkey,      // SPL token mint
    pub token_decimals: u8,      // Token decimals
    pub max_fee_bps: u16,        // Max fee (basis points)
    pub market_counter: u64,     // Total markets
    pub paused: bool,            // Pause flag
    pub bump: u8,                // PDA bump
}
```

#### Market (PDA)
```rust
pub struct Market {
    pub id: u64,
    pub question: String,        // Max 200 chars
    pub resolution_time: i64,
    pub state: MarketState,      // Active, Resolved, Cancelled
    pub winning_outcome: Outcome, // None, Yes, No
    pub yes_pool: u64,
    pub no_pool: u64,
    pub creator: Pubkey,
    pub bump: u8,
    pub vault_bump: u8,
    // ...
}
```

#### UserPosition (PDA)
```rust
pub struct UserPosition {
    pub market_id: u64,
    pub user: Pubkey,
    pub yes_bet: u64,
    pub no_bet: u64,
    pub claimed: bool,
    pub bump: u8,
}
```

### PDA Seeds

| Account | Seeds |
|---------|-------|
| Config | `["config"]` |
| Market | `["market", market_id]` |
| Market Vault | `["vault", market_id]` |
| UserPosition | `["position", market_id, user]` |

---

## Usage Examples

### Initialize Program

```typescript
await program.methods
  .initialize(feeRecipient, maxFeeBps)
  .accounts({
    admin: admin.publicKey,
    config: configPda,
    tokenMint: tokenMint,
    systemProgram: SystemProgram.programId,
  })
  .signers([admin])
  .rpc();
```

### Create Market

```typescript
await program.methods
  .createMarket(question, resolutionTime, feeAmount)
  .accounts({
    creator: creator.publicKey,
    config: configPda,
    market: marketPda,
    marketVault: marketVaultPda,
    tokenMint: tokenMint,
    creatorTokenAccount: creatorAta,
    feeRecipientTokenAccount: feeRecipientAta,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([creator])
  .rpc();
```

### Place Bet

```typescript
await program.methods
  .placeBet(marketId, { yes: {} }, amount)
  .accounts({
    bettor: bettor.publicKey,
    config: configPda,
    market: marketPda,
    marketVault: marketVaultPda,
    userPosition: userPositionPda,
    bettorTokenAccount: bettorAta,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([bettor])
  .rpc();
```

### Resolve Market

```typescript
await program.methods
  .resolveMarket(marketId, { yes: {} })
  .accounts({
    admin: admin.publicKey,
    config: configPda,
    market: marketPda,
  })
  .signers([admin])
  .rpc();
```

### Claim Winnings

```typescript
await program.methods
  .claimWinnings(marketId)
  .accounts({
    user: user.publicKey,
    market: marketPda,
    marketVault: marketVaultPda,
    userPosition: userPositionPda,
    userTokenAccount: userAta,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([user])
  .rpc();
```

---

## Testing

```bash
# Run all tests
anchor test

# Run tests with logs
anchor test -- --features anchor-debug

# Run specific test
anchor test -- --grep "should create a market"
```

---

## Deployment

### Devnet

```bash
# Set cluster
solana config set --url devnet

# Airdrop SOL
solana airdrop 2

# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Get program ID
solana address -k target/deploy/prediction_market-keypair.json
```

### Mainnet

```bash
# WARNING: Ensure thorough testing and auditing first!

# Set cluster
solana config set --url mainnet-beta

# Build
anchor build

# Deploy (requires SOL for rent)
anchor deploy --provider.cluster mainnet-beta
```

---

## Security

### Security Features

- PDA-based account derivation
- Admin-only functions with signer verification
- Checked arithmetic (overflow protection)
- Emergency pause mechanism
- Token vault with program authority

### Known Limitations

- Manual resolution only (no oracle integration)
- Admin has significant control
- Non-upgradeable (by design for v1)

---

## Gas/Rent Costs

Estimated costs (may vary):

| Operation | Compute Units | Rent (SOL) |
|-----------|---------------|------------|
| Initialize | ~50,000 | ~0.002 |
| Create Market | ~100,000 | ~0.003 |
| Place Bet | ~80,000 | ~0.002 |
| Resolve Market | ~30,000 | - |
| Claim Winnings | ~60,000 | - |

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) file.

---

## Disclaimer

**THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.**

**IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**

This project is intended for educational and learning purposes only. The program has NOT been audited by any professional security firm. Before using any of this code in a production environment:

1. Conduct a thorough security audit
2. Test extensively on devnet
3. Understand the risks involved
4. Consult with blockchain security experts

---

## Links

- [EVM Version](https://github.com/SivaramPg/evm-simple-prediction-market-contract)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)

---

<div align="center">

**Star this repo if you find it useful!**

</div>
