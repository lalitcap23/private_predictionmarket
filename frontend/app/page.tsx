"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useProgram, useConnection } from "@/lib/program";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const program = useProgram();
  const connection = useConnection();
  const [config, setConfig] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (program && connection) {
      loadConfig();
    }
  }, [program, connection]);

  const loadConfig = async () => {
    if (!program) return;
    
    try {
      setLoading(true);
      const { PublicKey } = await import("@solana/web3.js");
      const { getConfigPda } = await import("@/lib/program");
      const [configPda] = getConfigPda();
      
      const configAccount = await program.account.config.fetch(configPda);
      setConfig(configAccount);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Prediction Market
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Blind Binary Prediction Market on Solana
            </p>
          </div>
          <WalletMultiButton />
        </header>

        {/* Connection Status */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Connection Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Wallet:</span>
              <span className={connected ? "text-green-600" : "text-red-600"}>
                {connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            {publicKey && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Address:</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {publicKey.toString().slice(0, 8)}...
                  {publicKey.toString().slice(-8)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Program:</span>
              <span className={program ? "text-green-600" : "text-red-600"}>
                {program ? "Ready" : "Not Ready"}
              </span>
            </div>
          </div>
        </div>

        {/* Config Info */}
        {config && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Program Configuration
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Admin:</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {config.admin.toString().slice(0, 8)}...
                  {config.admin.toString().slice(-8)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Market Counter:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {config.marketCounter.toString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Paused:</span>
                <span className={config.paused ? "text-red-600" : "text-green-600"}>
                  {config.paused ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Create Market
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new SOL price prediction market with Pyth oracle
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Stake & Commit
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stake tokens and commit to a blind prediction (commit-reveal)
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Reveal & Claim
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Reveal your prediction and claim 5x fixed-odds winnings
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">
            How It Works
          </h3>
          <ol className="list-decimal space-y-2 pl-6 text-blue-800 dark:text-blue-200">
            <li>Connect your Solana wallet</li>
            <li>Create or browse prediction markets</li>
            <li>Stake tokens and commit to your prediction (hidden)</li>
            <li>After market resolves, reveal your choice</li>
            <li>Claim 5x payout if you predicted correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
