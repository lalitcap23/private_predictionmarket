"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useProgram, useConnection, getConfigPda } from "@/lib/program";
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import Initialize from "@/components/Initialize";
import MarketList from "@/components/MarketList";
import CreateMarket from "@/components/CreateMarket";
import StakeAndCommit from "@/components/StakeAndCommit";
import RevealAndClaim from "@/components/RevealAndClaim";
import AdminActions from "@/components/AdminActions";

import { PROGRAM_ID, SOLANA_CLUSTER, RPC_ENDPOINT } from "@/config/solana";
import { isAdmin } from "@/lib/utils";

type Tab = "initialize" | "markets" | "create" | "stake" | "reveal" | "admin";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { program } = useProgram();
  const { connection } = useConnection();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("markets");
  const [mounted, setMounted] = useState(false);

  const walletAddress = publicKey?.toBase58();

  // Avoid hydration mismatch: WalletMultiButton renders different HTML on server vs client
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Load on-chain config ──
  useEffect(() => {
    if (!program) return;
    (async () => {
      try {
        setLoading(true);
        const [configPda] = getConfigPda();
        setConfig(await program.account.config.fetch(configPda));
      } catch (err) {
        console.error("Error loading config:", err);
        // If config doesn't exist, show initialize tab
        setActiveTab("initialize");
      } finally {
        setLoading(false);
      }
    })();
  }, [program]);

  // ── Load SOL balance ──
  useEffect(() => {
    if (!publicKey || !connection) {
      setBalance(null);
      return;
    }
    connection
      .getBalance(publicKey)
      .then((b) => setBalance(b / 1e9))
      .catch((err) => console.error("Error loading balance:", err));
  }, [publicKey, connection]);

  // ── Tabs ──
  const tabs: { id: Tab; label: string }[] = [];
  
  // Show initialize tab if config doesn't exist
  if (!config) {
    tabs.push({ id: "initialize", label: "⚠️ Initialize Program" });
  } else {
    tabs.push(
      { id: "markets", label: "Markets" },
      { id: "create", label: "Create Market" },
      { id: "stake", label: "Stake & Commit" },
      { id: "reveal", label: "Reveal & Claim" },
      { id: "admin", label: "Admin" }
    );
  }

  const isUserAdmin = config && publicKey && isAdmin(publicKey, config);

  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";
  const explorerUrl = (addr: string) =>
    `https://explorer.solana.com/address/${addr}${cluster === "devnet" ? "?cluster=devnet" : ""}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* ── Header ── */}
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
            {walletAddress && balance !== null && (
              <div className="rounded-lg bg-white px-4 py-2 shadow dark:bg-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Balance:{" "}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {balance.toFixed(4)} SOL
                </span>
              </div>
            )}

            {/* Solana Wallet Adapter Button - only render on client to avoid hydration mismatch */}
            {mounted ? (
              <WalletMultiButton />
            ) : (
              <div className="wallet-adapter-button wallet-adapter-button-trigger h-10 min-w-[max-content] rounded-lg px-4 py-2 text-sm font-medium" />
            )}
          </div>
        </header>

        {/* ── Error ── */}
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

        {/* ── Status bar ── */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Wallet:{" "}
                </span>
                <span
                  className={`font-semibold ${
                    connected && walletAddress
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {connected && walletAddress
                    ? "Connected"
                    : "Not Connected"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Program:{" "}
                </span>
                <span
                  className={`font-semibold ${program ? "text-green-600" : "text-red-600"}`}
                >
                  {program ? "Ready" : "Not Ready"}
                </span>
              </div>
              {config && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Markets:{" "}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {config.marketCounter.toString()}
                  </span>
                </div>
              )}
            </div>

            {walletAddress && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </p>
                <a
                  href={explorerUrl(walletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300">
                🔍 Debug Info (Click to expand)
              </summary>
              <div className="mt-2 space-y-1 rounded bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cluster:</span>{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {SOLANA_CLUSTER}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">RPC:</span>{" "}
                  <span className="text-gray-900 dark:text-white">{RPC_ENDPOINT}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Program ID:</span>{" "}
                  <a
                    href={explorerUrl(PROGRAM_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {PROGRAM_ID}
                  </a>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Config PDA:</span>{" "}
                  <a
                    href={explorerUrl(getConfigPda()[0].toString())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {getConfigPda()[0].toString()}
                  </a>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* ── Tabs ── */}
        {connected && (
          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* ── Content ── */}
        <div className="space-y-6">
          {!connected ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-lg dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to Prediction Market
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Connect your Solana wallet to start creating and participating in
                prediction markets
              </p>
              {mounted ? (
                <WalletMultiButton />
              ) : (
                <div className="wallet-adapter-button wallet-adapter-button-trigger mx-auto h-10 min-w-[max-content] rounded-lg px-4 py-2 text-sm font-medium" />
              )}
            </div>
          ) : (
            <>
              {activeTab === "initialize" && <Initialize />}
              {activeTab === "markets" && <MarketList />}
              {activeTab === "create" && <CreateMarket />}
              {activeTab === "stake" && <StakeAndCommit />}
              {activeTab === "reveal" && <RevealAndClaim />}
              {activeTab === "admin" && <AdminActions />}
            </>
          )}
        </div>

        {/* ── How it works ── */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">
            How It Works
          </h3>
          <ol className="list-decimal space-y-2 pl-6 text-blue-800 dark:text-blue-200">
            <li>
              Create a prediction market with a SOL price threshold and
              resolution time
            </li>
            <li>
              Stake tokens and commit to your prediction (YES or NO) -- your
              choice is hidden!
            </li>
            <li>
              After the market resolves using Pyth oracle, reveal your
              prediction
            </li>
            <li>
              If you predicted correctly, claim your 5x fixed-odds payout
            </li>
            <li>
              Markets resolve automatically based on SOL/USD price from Pyth
              oracle
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
