"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useProgram, useConnection } from "@/lib/program";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import MarketList from "@/components/MarketList";
import CreateMarket from "@/components/CreateMarket";
import StakeAndCommit from "@/components/StakeAndCommit";
import RevealAndClaim from "@/components/RevealAndClaim";
import ClaimWinnings from "@/components/ClaimWinnings";
import AdminActions from "@/components/AdminActions";

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { program, wallet: solanaWallet } = useProgram();
  const connection = useConnection();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"markets" | "create" | "stake" | "reveal" | "claim" | "admin">("markets");

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

  const tabs = [
    { id: "markets", label: "Markets" },
    { id: "create", label: "Create Market" },
    { id: "stake", label: "Stake & Commit" },
    { id: "reveal", label: "Reveal & Claim" },
    { id: "claim", label: "Claim Winnings" },
  ];

  // Add admin tab if user is admin
  if (config && solanaWalletAddress) {
    const userPubkey = new PublicKey(solanaWalletAddress);
    if (userPubkey.equals(config.admin)) {
      if (!tabs.find(t => t.id === "admin")) {
        tabs.push({ id: "admin", label: "Admin" });
      }
    }
  }

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
              Blind Binary Prediction Market on Solana with Pyth Oracle
            </p>
          </div>
          <div className="flex items-center gap-4">
            {solanaWalletAddress && balance !== null && (
              <div className="rounded-lg bg-white px-4 py-2 shadow dark:bg-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Balance: </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {balance.toFixed(4)} SOL
                </span>
              </div>
            )}
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
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Wallet: </span>
                <span className={authenticated && solanaWalletAddress ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                  {authenticated && solanaWalletAddress ? "Connected" : "Not Connected"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Program: </span>
                <span className={program ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                  {program ? "Ready" : "Not Ready"}
                </span>
              </div>
              {config && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Markets: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {config.marketCounter.toString()}
                  </span>
                </div>
              )}
            </div>
            {solanaWalletAddress && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {solanaWalletAddress.slice(0, 8)}...{solanaWalletAddress.slice(-8)}
                </p>
                <a
                  href={getExplorerUrl(solanaWalletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {authenticated && (
          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {!authenticated ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to Prediction Market
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Connect your wallet to start creating and participating in prediction markets
              </p>
              <button
                onClick={handleLogin}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-700"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {activeTab === "markets" && <MarketList />}
              {activeTab === "create" && <CreateMarket />}
              {activeTab === "stake" && <StakeAndCommit />}
              {activeTab === "reveal" && <RevealAndClaim />}
              {activeTab === "claim" && <ClaimWinnings />}
              {activeTab === "admin" && <AdminActions />}
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">
            How It Works
          </h3>
          <ol className="list-decimal space-y-2 pl-6 text-blue-800 dark:text-blue-200">
            <li>Create a prediction market with a SOL price threshold and resolution time</li>
            <li>Stake tokens and commit to your prediction (YES or NO) - your choice is hidden!</li>
            <li>After the market resolves using Pyth oracle, reveal your prediction</li>
            <li>If you predicted correctly, claim your 5x fixed-odds payout</li>
            <li>Markets resolve automatically based on SOL/USD price from Pyth oracle</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
