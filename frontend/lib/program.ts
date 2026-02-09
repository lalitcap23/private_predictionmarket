"use client";

import { useMemo } from "react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Commitment } from "@solana/web3.js";

import idl from "./idl.json";
import { PROGRAM_ID } from "@/config/solana";
import { PredictionMarket } from "@/types/prediction_market";

const commitment: Commitment = "confirmed";

// ────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────

/**
 * Returns an Anchor Program client using the Solana Wallet Adapter.
 * program is null until a wallet is connected.
 */
export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo<Program<PredictionMarket> | null>(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;

    try {
      // Wallet adapter already implements the correct interface for Anchor
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment,
      });

      const programId = new PublicKey(PROGRAM_ID);
      console.log("Creating program with ID:", programId.toString());
      console.log("Connected to RPC:", connection.rpcEndpoint);

      return new Program(
        idl as Idl,
        programId,
        provider
      ) as Program<PredictionMarket>;
    } catch (error) {
      console.error("Error creating program client:", error);
      return null;
    }
  }, [connection, wallet]);

  return { program, wallet };
}

/**
 * Re-export useConnection for convenience
 */
export { useConnection };

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
