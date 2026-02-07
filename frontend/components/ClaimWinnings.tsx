"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram, getMarketPda, getMarketVaultPda, getPositionPda, getConfigPda } from "@/lib/program";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

export default function ClaimWinnings() {
  const { program, wallet } = useProgram();
  const [marketId, setMarketId] = useState("");
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

      const tx = await program.methods
        .claimWinnings(marketIdNum)
        .accounts({
          user: userPubkey,
          userTokenAccount: userTokenAccount,
        } as any)
        .rpc();

      setSuccess(`Winnings claimed! Transaction: ${tx}`);
      
      // Reset form
      setMarketId("");
    } catch (err: any) {
      console.error("Error claiming winnings:", err);
      setError(err?.message || "Failed to claim winnings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Claim Winnings
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Claim winnings from resolved or cancelled markets (for traditional bets)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !program || !wallet}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Claiming..." : "Claim Winnings"}
        </button>
      </form>
    </div>
  );
}

