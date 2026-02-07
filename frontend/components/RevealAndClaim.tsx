"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram, getMarketPda, getMarketVaultPda, getPositionPda } from "@/lib/program";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { getConfigPda } from "@/lib/program";

export default function RevealAndClaim() {
  const { program, wallet } = useProgram();
  const [marketId, setMarketId] = useState("");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [saltHex, setSaltHex] = useState("");
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

      const userPubkey = new PublicKey(wallet.address);
      const marketIdNum = parseInt(marketId);
      
      // Convert salt from hex
      const salt = Buffer.from(saltHex.replace(/^0x/, ""), "hex");
      if (salt.length !== 32) {
        throw new Error("Salt must be 32 bytes (64 hex characters)");
      }

      const [marketPda] = getMarketPda(marketIdNum);
      const [vaultPda] = getMarketVaultPda(marketIdNum);
      const [positionPda] = getPositionPda(marketIdNum, userPubkey);
      
      const [configPda] = getConfigPda();
      const config = await program.account.config.fetch(configPda);
      const tokenMint = new PublicKey(config.tokenMint);
      
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        userPubkey
      );

      const outcomeEnum = outcome === "yes" ? { yes: {} } : { no: {} };

      const tx = await program.methods
        .revealAndClaim(marketIdNum, outcomeEnum, Array.from(salt))
        .accounts({
          user: userPubkey,
          userTokenAccount: userTokenAccount,
        } as any)
        .rpc();

      setSuccess(`Revealed and claimed! Transaction: ${tx}`);
      
      // Reset form
      setMarketId("");
      setSaltHex("");
    } catch (err: any) {
      console.error("Error revealing and claiming:", err);
      setError(err?.message || "Failed to reveal and claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Reveal & Claim
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
            Your Prediction
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
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Salt (Hex)
          </label>
          <input
            type="text"
            value={saltHex}
            onChange={(e) => setSaltHex(e.target.value)}
            placeholder="e.g., 0x1234... (64 hex characters)"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The salt you saved when committing (32 bytes = 64 hex chars)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !program || !wallet}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Revealing..." : "Reveal & Claim (5x if correct)"}
        </button>
      </form>
    </div>
  );
}

