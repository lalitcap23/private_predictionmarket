# Understanding Program Deployment

## The Two Accounts Involved

### 1. Program Keypair (Buffer Account)
**Address**: `HooJVn1K9FbcCjiiiga3KLSgb5PcNjwNKh1Hq8GwWZiz`
- Location: `target/deploy/prediction_market-keypair.json`
- Purpose: This becomes the program's on-chain address
- Needs: ~3.75 SOL to deploy the program bytecode
- Current Balance: 11.18 SOL ✅ (Enough!)

### 2. Upgrade Authority (Your Wallet)
**Address**: `455q3UD1KkfMP7zWrd2XcYoZW8LaVoiU969cmusengZ9`
- Location: `~/.config/solana/id.json`
- Purpose: Signs the deployment transaction
- Can: Upgrade the program in the future
- Current Balance: 234.48 SOL ✅

## Why Your Deploy Failed

❌ **Anchor.toml was set to `cluster = "localnet"`**
- But localnet (http://127.0.0.1:8899) isn't running!
- So deployment tried to connect to localnet and failed

✅ **Fixed**: Changed Anchor.toml to `cluster = "devnet"`

## Deploy Commands

### Deploy to Devnet (Recommended)
```bash
# Method 1: Using Anchor.toml settings (now fixed)
anchor deploy

# Method 2: Explicit cluster override
anchor deploy --provider.cluster devnet
```

### Check Deployment Status
```bash
# Check if program exists on devnet
solana account 5jRd4dAToWZAMPrhJS2HaCUDtaY5AYCSbtY3KRW1soDL --url devnet

# Check program keypair balance
solana balance HooJVn1K9FbcCjiiiga3KLSgb5PcNjwNKh1Hq8GwWZiz --url devnet
```

## Program Already Deployed ✅

Good news! The program is **already deployed to devnet**:
- Program ID: `5jRd4dAToWZAMPrhJS2HaCUDtaY5AYCSbtY3KRW1soDL`
- View it: https://explorer.solana.com/address/5jRd4dAToWZAMPrhJS2HaCUDtaY5AYCSbtY3KRW1soDL?cluster=devnet

## If You Need to Redeploy

```bash
# 1. Build the program
anchor build

# 2. Fund the program keypair if needed
solana transfer HooJVn1K9FbcCjiiiga3KLSgb5PcNjwNKh1Hq8GwWZiz 5 --url devnet

# 3. Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Understanding the Error

The error message:
```
Error: Account HooJVn1K9FbcCjiiiga3KLSgb5PcNjwNKh1Hq8GwWZiz has insufficient funds
```

Was misleading! The real problem was:
- ❌ Trying to connect to localnet (not running)
- ✅ Account actually has enough SOL (11.18 SOL)

## Key Takeaway

**The keypair at `target/deploy/prediction_market-keypair.json`** determines your program's address. Keep this file safe!

If you lose it:
- ❌ Can't upgrade the program
- ❌ Need to deploy a new program with a new address
