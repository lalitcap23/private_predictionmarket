"use client";

import { useMemo, useRef } from "react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  Commitment,
} from "@solana/web3.js";
import { useWallets } from "@privy-io/react-auth/solana";

import idl from "./idl.json";
import { PROGRAM_ID, RPC_ENDPOINT } from "@/config/solana";
import { PredictionMarket } from "@/types/prediction_market";

const commitment: Commitment = "confirmed";

// ────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────

/**
 * Returns an Anchor Program client and the connected Privy Solana wallet.
 *
 * Uses `useWallets()` from `@privy-io/react-auth/solana` which returns
 * `ConnectedStandardSolanaWallet[]` with real `.signTransaction()`.
 */
export function useProgram() {
  const { wallets, ready } = useWallets();

  // First connected Solana wallet
  const wallet = useMemo(() => {
    if (!ready || wallets.length === 0) return null;
    return wallets[0];
  }, [wallets, ready]);

  // Keep a ref so the Anchor wallet adapter always calls signTransaction
  // on the *latest* wallet object without needing to recreate the program.
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const program = useMemo<Program<PredictionMarket> | null>(() => {
    if (!wallet) return null;

    try {
      const connection = new Connection(RPC_ENDPOINT, commitment);

      // Anchor-compatible wallet adapter that delegates to Privy's
      // ConnectedStandardSolanaWallet.signTransaction()
      const anchorWallet = {
        publicKey: new PublicKey(wallet.address),

        async signTransaction<T extends Transaction | VersionedTransaction>(
          tx: T
        ): Promise<T> {
          const w = walletRef.current;
          if (!w) throw new Error("Wallet disconnected");

          // Serialize → Privy signs → deserialize back
          const serialized =
            tx instanceof VersionedTransaction
              ? tx.serialize()
              : tx.serialize({
                  requireAllSignatures: false,
                  verifySignatures: false,
                });

          const { signedTransaction } = await w.signTransaction({
            transaction: new Uint8Array(serialized),
          });

          if (tx instanceof VersionedTransaction) {
            return VersionedTransaction.deserialize(signedTransaction) as T;
          }
          return Transaction.from(signedTransaction) as T;
        },

        async signAllTransactions<
          T extends Transaction | VersionedTransaction,
        >(txs: T[]): Promise<T[]> {
          return Promise.all(txs.map((tx) => this.signTransaction(tx)));
        },
      };

      const provider = new AnchorProvider(connection, anchorWallet as any, {
        commitment,
      });

      return new (Program as any)(
        idl as Idl,
        new PublicKey(PROGRAM_ID),
        provider
      ) as Program<PredictionMarket>;
    } catch (error) {
      console.error("Error creating program client:", error);
      return null;
    }
  }, [wallet]);

  return { program, wallet };
}

/** Raw @solana/web3.js Connection (no wallet needed). */
export function useConnection() {
  return useMemo(() => new Connection(RPC_ENDPOINT, commitment), []);
}

// ────────────────────────────────────────────────
// PDA helpers (pure functions)
// ────────────────────────────────────────────────

export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(PROGRAM_ID)
  );
}

export function getMarketPda(marketId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(marketId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), buf],
    new PublicKey(PROGRAM_ID)
  );
}

export function getMarketVaultPda(marketId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(marketId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), buf],
    new PublicKey(PROGRAM_ID)
  );
}

export function getPositionPda(
  marketId: number,
  user: PublicKey
): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(marketId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), buf, user.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
}
