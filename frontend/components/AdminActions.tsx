"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram, useConnection, getMarketPda, getConfigPda } from "@/lib/program";
import { isAdmin } from "@/lib/utils";

export default function AdminActions() {
  const { program, wallet } = useProgram();
  const connection = useConnection();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Resolve market
  const [resolveMarketId, setResolveMarketId] = useState("");
  
  // Cancel market
  const [cancelMarketId, setCancelMarketId] = useState("");

  useEffect(() => {
    if (program && wallet) {
      loadConfig();
    }
  }, [program, wallet]);

  const loadConfig = async () => {
    if (!program) return;
    try {
      const [configPda] = getConfigPda();
      const configData = await program.account.config.fetch(configPda);
      setConfig(configData);
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  const handleResolveMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !wallet || !connection) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAdmin(new PublicKey(wallet.address), config)) {
      setError("Only admin can resolve markets");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const marketIdNum = parseInt(resolveMarketId);
      const [marketPda] = getMarketPda(marketIdNum);

      // Get Pyth price update account address from API route (NO Pyth SDK import on client!)
      const response = await fetch("/api/pyth");
      if (!response.ok) {
        throw new Error("Failed to get Pyth price update account");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to get Pyth price update account");
      }
      const priceUpdateAccount = new PublicKey(data.data.priceUpdateAccountAddress);

      // Create resolve market instruction
      // Anchor will auto-resolve config and market PDAs, we only need to specify priceUpdate
      const tx = await program.methods
        .resolveMarket(marketIdNum, { none: {} }) // Outcome ignored, uses oracle
        .accounts({
          admin: new PublicKey(wallet.address),
          priceUpdate: priceUpdateAccount,
        })
        .rpc();

      setSuccess(`Market resolved! Transaction: ${tx}`);
      setResolveMarketId("");
    } catch (err: any) {
      console.error("Error resolving market:", err);
      setError(err?.message || "Failed to resolve market. Make sure the market has expired and Pyth price update is available.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !wallet) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAdmin(new PublicKey(wallet.address), config)) {
      setError("Only admin can cancel markets");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const marketIdNum = parseInt(cancelMarketId);
      const [marketPda] = getMarketPda(marketIdNum);
      const [configPda] = getConfigPda();

      const tx = await program.methods
        .cancelMarket(marketIdNum)
        .accounts({
          admin: new PublicKey(wallet.address),
        })
        .rpc();

      setSuccess(`Market cancelled! Transaction: ${tx}`);
      setCancelMarketId("");
    } catch (err: any) {
      console.error("Error cancelling market:", err);
      setError(err?.message || "Failed to cancel market");
    } finally {
      setLoading(false);
    }
  };

  if (!config || !isAdmin(wallet ? new PublicKey(wallet.address) : null, config)) {
    return null;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Admin Actions
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

      <div className="space-y-6">
        {/* Resolve Market */}
        <form onSubmit={handleResolveMarket} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resolve Market
          </h3>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Market ID
            </label>
            <input
              type="number"
              value={resolveMarketId}
              onChange={(e) => setResolveMarketId(e.target.value)}
              placeholder="e.g., 1"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Uses Pyth oracle to determine winner
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Resolving..." : "Resolve Market"}
          </button>
        </form>

        {/* Cancel Market */}
        <form onSubmit={handleCancelMarket} className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cancel Market
          </h3>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Market ID
            </label>
            <input
              type="number"
              value={cancelMarketId}
              onChange={(e) => setCancelMarketId(e.target.value)}
              placeholder="e.g., 1"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
              min="1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Can only cancel expired markets
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Cancel Market"}
          </button>
        </form>
      </div>
    </div>
  );
}

