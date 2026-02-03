"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram, getMarketPda, getMarketVaultPda, getPositionPda, getConfigPda } from "@/lib/program";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { generateCommitment, generateSalt } from "@/lib/utils";

export default function StakeAndCommit() {
  const { program, wallet } = useProgram();
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
    if (!program || !wallet) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const bettorPubkey = new PublicKey(wallet.address);
      const marketIdNum = parseInt(marketId);
      
      // Generate salt and commitment
      const newSalt = generateSalt();
      const [configPda] = getConfigPda();
      const config = await program.account.config.fetch(configPda);
      const tokenMint = new PublicKey(config.tokenMint);
      
      const commitmentHash = generateCommitment(marketIdNum, bettorPubkey, outcome, newSalt);
      
      setSalt(newSalt);
      setCommitment(Buffer.from(commitmentHash).toString("hex"));

      const [marketPda] = getMarketPda(marketIdNum);
      const [vaultPda] = getMarketVaultPda(marketIdNum);
      const [positionPda] = getPositionPda(marketIdNum, bettorPubkey);
      
      const bettorTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        bettorPubkey
      );

      const amountBN = new BN(parseFloat(amount) * 1e9); // Assuming 9 decimals

      const tx = await program.methods
        .stakeAndCommit(marketIdNum, amountBN, Array.from(commitmentHash))
        .accounts({
          bettor: bettorPubkey,
          config: configPda,
          market: marketPda,
          marketVault: vaultPda,
          userPosition: positionPda,
          bettorTokenAccount: bettorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: PublicKey.default,
        })
        .rpc();

      setSuccess(`Stake committed! Transaction: ${tx}`);
      
      // Reset form
      setAmount("");
    } catch (err: any) {
      console.error("Error staking and committing:", err);
      setError(err?.message || "Failed to stake and commit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Stake & Commit
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-200">
          {success}
          {salt && commitment && (
            <div className="mt-2 rounded bg-white p-2 text-xs dark:bg-gray-700">
              <p className="font-semibold">Save these values to reveal later:</p>
              <p>Salt: {Buffer.from(salt).toString("hex")}</p>
              <p>Commitment: {commitment}</p>
              <p className="mt-1 text-red-600 dark:text-red-400">
                ⚠️ You need these to claim winnings!
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
            Amount (SOL)
          </label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 1.0"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            min="0.001"
          />
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

