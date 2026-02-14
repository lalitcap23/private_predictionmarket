"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram, useConnection, getMarketPda } from "@/lib/program";
import { formatDate, formatNumber, outcomeToString, getStateColor, stateToString } from "@/lib/utils";
import { BN } from "@coral-xyz/anchor";

function toNum(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (BN.isBN(v)) return v.toNumber();
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

interface Market {
  id: number;
  question: string;
  resolutionTime: number;
  state: string;
  winningOutcome: any;
  yesPool: BN;
  noPool: BN;
  creator: PublicKey;
  createdAt: number;
  revealDeadline: number;
}

export default function MarketList() {
  const { program } = useProgram();
  const connection = useConnection();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (program) {
      loadMarkets();
    }
  }, [program]);

  const loadMarkets = async () => {
    if (!program) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch config to get market counter
      const { getConfigPda } = await import("@/lib/program");
      const [configPda] = getConfigPda();
      const config = await program.account.config.fetch(configPda);
      const marketCount = config.marketCounter.toNumber();
      
      // Fetch all markets
      const marketPromises: Promise<any>[] = [];
      for (let i = 1; i <= marketCount; i++) {
        try {
          const [marketPda] = getMarketPda(i);
          marketPromises.push(
            program.account.market.fetch(marketPda).then((market: any) => ({
              id: i,
              ...market,
            })).catch(() => null)
          );
        } catch (err) {
          // Market might not exist, skip
        }
      }
      
      const results = await Promise.all(marketPromises);
      const validMarkets = results.filter((m) => m !== null) as Market[];
      
      // Sort by creation time (newest first) — normalize BN to number for sort
      validMarkets.sort((a, b) => toNum(b.createdAt) - toNum(a.createdAt));
      
      setMarkets(validMarkets);
    } catch (err: any) {
      console.error("Error loading markets:", err);
      setError(err?.message || "Failed to load markets");
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (marketId: number) => {
    const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
    const [marketPda] = getMarketPda(marketId);
    if (cluster === "devnet") {
      return `https://explorer.solana.com/address/${marketPda.toString()}?cluster=devnet`;
    }
    return `https://explorer.solana.com/address/${marketPda.toString()}`;
  };

  if (loading && markets.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading markets...</p>
      </div>
    );
  }

  if (error && markets.length === 0) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-800 dark:bg-red-900/20 dark:text-red-200">
        <p className="font-semibold">Error loading markets:</p>
        <p>{error}</p>
        <button
          onClick={loadMarkets}
          className="mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Markets</h2>
        <button
          onClick={loadMarkets}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {markets.length === 0 ? (
        <div className="py-8 text-center text-gray-600 dark:text-gray-400">
          <p>No markets found. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {markets.map((market) => (
            <div
              key={toNum(market.id)}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {market.question}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>ID: {toNum(market.id)}</span>
                    <span>•</span>
                    <span>Created: {formatDate(toNum(market.createdAt))}</span>
                    <span>•</span>
                    <span>Resolves: {formatDate(toNum(market.resolutionTime))}</span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStateColor(
                    stateToString(market.state)
                  )}`}
                >
                  {stateToString(market.state).toUpperCase()}
                </span>
              </div>

              {stateToString(market.state) === "resolved" && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Winner:{" "}
                  </span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {outcomeToString(market.winningOutcome)}
                  </span>
                </div>
              )}

              <div className="mb-3 flex gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">YES Pool: </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(market.yesPool)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">NO Pool: </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(market.noPool)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <a
                  href={getExplorerUrl(toNum(market.id))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  View on Explorer
                </a>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  Creator: {market.creator.toString().slice(0, 8)}...
                  {market.creator.toString().slice(-8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

