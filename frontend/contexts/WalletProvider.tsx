"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { RPC_ENDPOINT, SOLANA_CLUSTER } from "@/config/solana";

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  if (!appId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-900">
            Privy App ID Missing
          </h2>
          <p className="text-red-700">
            Please set NEXT_PUBLIC_PRIVY_APP_ID in your .env.local file.
          </p>
          <p className="mt-2 text-sm text-red-600">
            Get your App ID from{" "}
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              https://dashboard.privy.io
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email", "sms", "google", "twitter", "discord", "github"],
        appearance: {
          theme: "light",
          accentColor: "#6366f1",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        solanaChains: [
          {
            id: SOLANA_CLUSTER === "devnet" ? "solana:devnet" : "solana:mainnet",
            name: SOLANA_CLUSTER === "devnet" ? "Solana Devnet" : "Solana Mainnet",
            network: SOLANA_CLUSTER === "devnet" ? "devnet" : "mainnet-beta",
            rpcUrl: RPC_ENDPOINT,
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
