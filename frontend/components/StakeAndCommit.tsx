"use client";

import { useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram, useConnection, getMarketPda, getMarketVaultPda, getPositionPda, getConfigPda } from "@/lib/program";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { generateCommitment, generateSalt } from "@/lib/utils";

export default function StakeAndCommit() {
  const { program, wallet } = useProgram();
  const { connection } = useConnection();
  const [marketId, setMarketId] = useState("");
  const [amount, setAmount] = useState("");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [salt, setSalt] = useState<Uint8Array | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !wallet?.publicKey) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const bettorPubkey = wallet.publicKey;
      const marketIdNum = parseInt(marketId, 10);
      if (Number.isNaN(marketIdNum) || marketIdNum < 1) {
        setError("Enter a valid market ID (e.g. 1)");
        setLoading(false);
        return;
      }

      const [configPda] = getConfigPda();
      const config = await program.account.config.fetch(configPda);
      const tokenMint = new PublicKey(config.tokenMint);
      const decimals = config.tokenDecimals ?? 9;
      const amountRaw = Math.floor(parseFloat(amount) * Math.pow(10, decimals));
      if (amountRaw <= 0) {
        setError("Amount must be greater than 0");
        setLoading(false);
        return;
      }

      const bettorTokenAccount = await getAssociatedTokenAddress(tokenMint, bettorPubkey);
      const bettorAtaInfo = await connection.getAccountInfo(bettorTokenAccount);
      const preInstructions: any[] = [];
      if (!bettorAtaInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            bettorPubkey,
            bettorTokenAccount,
            bettorPubkey,
            tokenMint
          )
        );
      }

      const newSalt = generateSalt();
      const commitmentHash = await generateCommitment(marketIdNum, bettorPubkey, outcome, newSalt);
      setSalt(newSalt);
      setCommitment(Buffer.from(commitmentHash).toString("hex"));

      const [marketPda] = getMarketPda(marketIdNum);
      const [vaultPda] = getMarketVaultPda(marketIdNum);
      const [positionPda] = getPositionPda(marketIdNum, bettorPubkey);

      const tx = await program.methods
        .stakeAndCommit(new BN(marketIdNum), new BN(amountRaw), Array.from(commitmentHash))
        .accounts({
          bettor: bettorPubkey,
          config: configPda,
          market: marketPda,
          marketVault: vaultPda,
          userPosition: positionPda,
          bettorTokenAccount: bettorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .preInstructions(preInstructions)
        .rpc();

      setSuccess(`Stake committed! Transaction: ${tx}`);
      setAmount("");
    } catch (err: any) {
      console.error("Error staking and committing:", err);
      const msg = err?.message ?? "";
      if (msg.includes("insufficient funds") || msg.includes("0x1")) {
        setError("Insufficient Wrapped SOL balance. Wrap SOL first (e.g. 1 SOL) then try again.");
      } else if (msg.includes("MarketNotActive") || msg.includes("6002")) {
        setError("Market is not active (expired or already resolved).");
      } else if (msg.includes("AlreadyCommitted")) {
        setError("You have already committed in this market.");
      } else {
        setError(msg || "Failed to stake and commit");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Stake & Commit
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Enter a market ID (from the Markets tab), amount in Wrapped SOL, and your hidden prediction. Your choice is stored as a commitment until reveal.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-200">
          {success}
          {salt && commitment && (
            <div className="mt-2 rounded bg-amber-50 p-3 text-xs dark:bg-amber-900/30">
              <p className="font-semibold text-amber-900 dark:text-amber-100">Save these to reveal later:</p>
              <p className="mt-1 break-all font-mono text-amber-800 dark:text-amber-200">Salt (hex): {Buffer.from(salt).toString("hex")}</p>
              <p className="mt-1 break-all font-mono text-amber-800 dark:text-amber-200">Commitment: {commitment}</p>
              <p className="mt-2 text-amber-700 dark:text-amber-300">
                ⚠️ You need your outcome (YES/NO) and this salt to reveal and claim. Store them safely.
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Market ID
          </label>
          <input
            type="number"
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            placeholder="e.g., 1"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            min="1"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount (Wrapped SOL)
          </label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 0.1"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            min="0.001"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You need Wrapped SOL. Wrap SOL in your wallet first, then enter the amount.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Prediction
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                checked={outcome === "yes"}
                onChange={(e) => setOutcome(e.target.value as "yes" | "no")}
                className="mr-2"
              />
              <span className="text-green-600 dark:text-green-400">YES</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                checked={outcome === "no"}
                onChange={(e) => setOutcome(e.target.value as "yes" | "no")}
                className="mr-2"
              />
              <span className="text-red-600 dark:text-red-400">NO</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your prediction is hidden until reveal
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !program || !wallet}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Staking..." : "Stake & Commit"}
        </button>
      </form>
    </div>
  );
}

