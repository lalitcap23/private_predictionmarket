"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useProgram, useConnection } from "@/lib/program";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { program, wallet: solanaWallet } = useProgram();
  const connection = useConnection();
  const [config, setConfig] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Find Solana wallet
  const solanaWalletAddress = solanaWallet?.address;

  const handleLogin = async () => {
    try {
      setError(null);
      await login();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Failed to connect wallet. Please try again.");
    }
  };

  useEffect(() => {
    if (program && connection) {
      loadConfig();
    }
  }, [program, connection]);

  // Load wallet balance
  useEffect(() => {
    if (solanaWalletAddress && connection) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [solanaWalletAddress, connection]);

  const loadBalance = async () => {
    if (!solanaWalletAddress || !connection) return;
    
    try {
      const { PublicKey } = await import("@solana/web3.js");
      const pubkey = new PublicKey(solanaWalletAddress);
      const balance = await connection.getBalance(pubkey);
      setBalance(balance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getExplorerUrl = (address: string) => {
    const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
    if (cluster === "devnet") {
      return `https://explorer.solana.com/address/${address}?cluster=devnet`;
    }
    return `https://explorer.solana.com/address/${address}`;
  };

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
          <div>
            {ready && !authenticated && (
              <button
                onClick={handleLogin}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={!ready}
              >
                Connect Wallet
              </button>
            )}
            {ready && authenticated && (
              <button
                onClick={logout}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Disconnect
              </button>
            )}
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Connection Status */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Connection Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Wallet:</span>
              <span className={authenticated && solanaWalletAddress ? "text-green-600" : "text-red-600"}>
                {authenticated && solanaWalletAddress ? "Connected" : "Not Connected"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Program:</span>
              <span className={program ? "text-green-600" : "text-red-600"}>
                {program ? "Ready" : "Not Ready"}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Details */}
        {solanaWalletAddress && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Connected Wallet
            </h2>
            <div className="space-y-4">
              {/* Wallet Address */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Wallet Address
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <p className="break-all font-mono text-sm text-gray-900 dark:text-white">
                      {solanaWalletAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(solanaWalletAddress)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    title="Copy address"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Wallet Type */}
              {solanaWallet && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Wallet Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {solanaWallet.walletClientType === "privy" 
                      ? "Privy Embedded Wallet" 
                      : solanaWallet.walletClientType || "Unknown"}
                  </span>
                </div>
              )}

              {/* Chain */}
              {solanaWallet && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Network:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {solanaWallet.chainId === "solana:devnet" 
                      ? "Solana Devnet" 
                      : solanaWallet.chainId === "solana:mainnet"
                      ? "Solana Mainnet"
                      : solanaWallet.chainId}
                  </span>
                </div>
              )}

              {/* Balance */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {balance !== null ? (
                    <span>{balance.toFixed(4)} SOL</span>
                  ) : (
                    <span className="text-gray-400">Loading...</span>
                  )}
                </span>
              </div>

              {/* Explorer Link */}
              <div className="pt-2">
                <a
                  href={getExplorerUrl(solanaWalletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View on Solana Explorer
                </a>
              </div>
            </div>
          </div>
        )}

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
