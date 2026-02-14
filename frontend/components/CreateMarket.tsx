"use client";

import { useState } from "react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram, useConnection, getMarketPda, getMarketVaultPda, getConfigPda } from "@/lib/program";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

export default function CreateMarket() {
  const { program, wallet } = useProgram();
  const { connection } = useConnection();
  const [question, setQuestion] = useState("");
  const [resolutionTime, setResolutionTime] = useState("");
  const [feeAmount, setFeeAmount] = useState("0");
  const [priceThreshold, setPriceThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !wallet) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const creatorPubkey = wallet.publicKey;
      const [configPda] = getConfigPda();
      const config = await program.account.config.fetch(configPda);
      
      const marketCounter = config.marketCounter.toNumber();
      const nextMarketId = marketCounter + 1;
      
      const [marketPda] = getMarketPda(nextMarketId);
      const [vaultPda] = getMarketVaultPda(nextMarketId);
      
      const tokenMint = new PublicKey(config.tokenMint);
      const creatorTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        creatorPubkey
      );
      
      const feeRecipientPubkey = new PublicKey(config.feeRecipient);
      const feeRecipientTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        feeRecipientPubkey
      );

      // ATA program only allows system-owned accounts (wallets) as ATA owners, not PDAs.
      const feeRecipientAccountInfo = await connection.getAccountInfo(feeRecipientPubkey);
      if (feeRecipientAccountInfo && !feeRecipientAccountInfo.owner.equals(SystemProgram.programId)) {
        setError(
          "Fee recipient is set to a program account (PDA), not a wallet. " +
          "Fix: go to the Admin tab → \"Update config\" → set \"New fee recipient\" to a wallet address (e.g. 5YXbYQCnBSTX3fmYbuGNSbY3J24v5KRZ11aWh856WWc3 or 455q3UD1KkfMP7zWrd2XcYoZW8LaVoiU969cmusengZ9) and click Update. You must be the program admin."
        );
        setLoading(false);
        return;
      }

      // Both token accounts must exist before createMarket. Create them if needed via preInstructions.
      const creatorAtaInfo = await connection.getAccountInfo(creatorTokenAccount);
      const feeRecipientAtaInfo = await connection.getAccountInfo(feeRecipientTokenAccount);
      const preInstructions: any[] = [];
      
      if (!creatorAtaInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            creatorPubkey,           // payer
            creatorTokenAccount,     // ATA to create
            creatorPubkey,           // owner
            tokenMint
          )
        );
      }
      
      // Only create fee recipient ATA if it's a system account (checked above) and doesn't exist yet.
      if (!feeRecipientAtaInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            creatorPubkey,           // payer
            feeRecipientTokenAccount,
            feeRecipientPubkey,     // owner (must be a wallet, not PDA)
            tokenMint
          )
        );
      }

      // Parse inputs: resolution_time (i64), fee_amount (u64), price_threshold (i64)
      const resolutionTimestamp = Math.floor(new Date(resolutionTime).getTime() / 1000);
      const feeAmountRaw = Math.floor(parseFloat(feeAmount) * 1e9);
      const priceThresholdRaw = Math.floor(parseFloat(priceThreshold) * 1e8);

      const tx = await program.methods
        .createMarket(
          question,
          new BN(resolutionTimestamp),
          new BN(feeAmountRaw),
          new BN(priceThresholdRaw)
        )
        .accounts({
          creator: creatorPubkey,
          config: configPda,
          market: marketPda,
          marketVault: vaultPda,
          tokenMint: tokenMint,
          creatorTokenAccount: creatorTokenAccount,
          feeRecipientTokenAccount: feeRecipientTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        } as any)
        .preInstructions(preInstructions)
        .rpc();

      setSuccess(`Market created! Transaction: ${tx}`);
      
      // Reset form
      setQuestion("");
      setResolutionTime("");
      setFeeAmount("");
      setPriceThreshold("");
      
      // Reload page after 2 seconds to show new market
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Error creating market:", err);
      const msg = err?.message || "";
      if (msg.includes("Provided owner is not allowed") || msg.includes("owner is not allowed")) {
        setError(
          "Fee recipient must be a wallet address. Go to Admin tab → Update config → set \"New fee recipient\" to your wallet and click Update. You must be the admin."
        );
      } else if (msg.includes("insufficient funds") || msg.includes("0x1")) {
        setError(
          "Insufficient token balance for the creation fee. Use Creation Fee = 0 to create without paying a fee, or add Wrapped SOL to your wallet."
        );
      } else {
        setError(msg || "Failed to create market");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Create Market
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Will SOL price be above $160?"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            maxLength={200}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Resolution Time
          </label>
          <input
            type="datetime-local"
            value={resolutionTime}
            onChange={(e) => setResolutionTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Market will resolve at this time using Pyth oracle
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Price Threshold (USD)
          </label>
          <input
            type="number"
            step="0.01"
            value={priceThreshold}
            onChange={(e) => setPriceThreshold(e.target.value)}
            placeholder="e.g., 160.00"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            If SOL price ≥ threshold, YES wins; else NO wins
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Creation Fee (SOL)
          </label>
          <input
            type="number"
            step="0.001"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="0 = no fee"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            min="0"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Use 0 for no fee. If you set a fee, you need enough Wrapped SOL in your wallet.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !program || !wallet}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Market"}
        </button>
      </form>
    </div>
  );
}

