"use client";

import { useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram, getConfigPda } from "@/lib/program";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export default function Initialize() {
  const { program, wallet } = useProgram();
  const [tokenMint, setTokenMint] = useState("");
  const [feeRecipient, setFeeRecipient] = useState("");
  const [maxFeeBps, setMaxFeeBps] = useState("100"); // 1%
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      const [configPda] = getConfigPda();
      const tokenMintPubkey = new PublicKey(tokenMint);
      const feeRecipientPubkey = new PublicKey(feeRecipient);
      const maxFeeBpsNum = parseInt(maxFeeBps);

      const tx = await program.methods
        .initialize(maxFeeBpsNum)
        .accounts({
          admin: wallet.publicKey,
          config: configPda,
          tokenMint: tokenMintPubkey,
          feeRecipient: feeRecipientPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      setSuccess(`Program initialized! Transaction: ${tx}`);
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Error initializing:", err);
      setError(err?.message || "Failed to initialize program");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Initialize Program
      </h2>

      <div className="mb-4 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ The prediction market program needs to be initialized before use.
          This is a one-time operation that creates the Config account.
        </p>
      </div>

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
            Token Mint Address
          </label>
          <input
            type="text"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            placeholder="e.g., So11111111111111111111111111111111111111112 (Wrapped SOL)"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            For devnet testing, use: So11111111111111111111111111111111111111112 (Wrapped SOL)
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fee Recipient Address
          </label>
          <input
            type="text"
            value={feeRecipient}
            onChange={(e) => setFeeRecipient(e.target.value)}
            placeholder="Your wallet address or treasury address"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Where market creation fees will be sent
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Max Fee (Basis Points)
          </label>
          <input
            type="number"
            value={maxFeeBps}
            onChange={(e) => setMaxFeeBps(e.target.value)}
            placeholder="100 = 1%"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
            min="0"
            max="10000"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            100 basis points = 1%, 1000 = 10% (max: 10000 = 100%)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !program || !wallet?.publicKey}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Initializing..." : "Initialize Program"}
        </button>
      </form>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> You must be the program admin to initialize.
          The connected wallet will become the admin.
        </p>
      </div>
    </div>
  );
}
