# Private Prediction Market

A Solana-based prediction market where users can make **private** binary predictions (YES/NO) using a commit-reveal scheme. Markets resolve automatically using Pyth Network's SOL/USD oracle.

## How It Works

### The Flow

1. **Admin creates a market** with a question, resolution time, and SOL price threshold
2. **Users stake wSOL and commit** their hidden prediction (YES or NO)
3. **Market resolves** automatically when resolution time passes, using Pyth oracle
4. **Users reveal** their prediction before the deadline
5. **Winners get their stake back** (1x refund), losers lose their stake

### Why Private?

Your prediction is stored as a **hash** on-chain until you reveal it. No one can see what you bet until after the market resolves. This prevents front-running and manipulation.

## Architecture

### Program (Rust/Anchor)

- **Program ID (devnet)**: `6CY8YgqAoXq66baW5B41Yw72D7unQjFN3wuMkZr2bCRM`
- **Key accounts**:
  - `Config`: Global settings (admin, token mint, fee recipient)
  - `Market`: Market data (question, resolution time, price threshold, vault)
  - `UserPosition`: Per-user commitment and reveal state

### Frontend (Next.js)

- Wallet integration via Solana Wallet Adapter
- Server-side Pyth price fetching (API route)
- Full admin panel for market management

## Quick Start

### Prerequisites

- Rust + Anchor CLI
- Node.js + npm/yarn
- Solana CLI (devnet configured)
- Devnet SOL: `solana airdrop 2`

### Deploy Program

```bash
anchor build
anchor deploy
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `frontend/.env`:

```env
NEXT_PUBLIC_SOLANA_CLUSTER="devnet"
NEXT_PUBLIC_RPC_ENDPOINT="https://api.devnet.solana.com"
NEXT_PUBLIC_PROGRAM_ID="6CY8YgqAoXq66baW5B41Yw72D7unQjFN3wuMkZr2bCRM"
```

### First Time Setup

1. Connect wallet → **Initialize** tab → Initialize config
2. **Create Market** → Set question, resolution time, price threshold
3. **Stake & Commit** → Enter market ID, amount, choose YES/NO → **Save the salt!**
4. Wait for resolution time → **Admin** → Resolve Market
5. **Reveal & Claim** → Enter market ID, outcome, salt → Get refund if correct

## Key Features

- **Commit-reveal**: Predictions hidden until reveal
- **Pyth oracle**: Automatic resolution based on SOL/USD price
- **Simple payouts**: 1x refund for correct predictions
- **Admin tools**: Create markets, resolve, forfeit unrevealed stakes

## Program Instructions

- `initialize`: Set up global config (admin only)
- `create_market`: Create new prediction market
- `stake_and_commit`: Stake tokens and commit hidden prediction
- `reveal_and_claim`: Reveal prediction and claim refund if correct
- `resolve_market`: Resolve market using Pyth oracle (admin only)
- `forfeit_unrevealed`: Transfer unrevealed stakes to protocol (admin only)

## Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel → Set root directory to `frontend/`
3. Add environment variables
4. Deploy

## Important Notes

- **Devnet only**: This is an MVP, not production-ready
- **Re-initialize after redeploy**: New program ID means fresh start
- **Save your salt**: You need it to reveal and claim
- **Reveal deadline**: 2 weeks after market resolution

## License

Educational purposes only. UNAUDITED - use at your own risk.
