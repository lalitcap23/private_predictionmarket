import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import idl from "./idl.json";
import { PROGRAM_ID, RPC_ENDPOINT } from "@/config/solana";
import { PredictionMarket } from "@/types/prediction_market";

const commitment: Commitment = "confirmed";

export function useProgram() {
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }

    try {
      const connection = new Connection(RPC_ENDPOINT, commitment);
      
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
        } as any,
        { commitment }
      );

      const program = new Program(
        idl as Idl,
        PROGRAM_ID,
        provider
      ) as Program<PredictionMarket>;

      return program;
    } catch (error) {
      console.error("Error creating program:", error);
      return null;
    }
  }, [wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  return program;
}

export function useConnection() {
  return useMemo(() => {
    return new Connection(RPC_ENDPOINT, commitment);
  }, []);
}

// Helper function to get PDAs
export function getMarketPda(marketId: number): [PublicKey, number] {
  const marketIdBuffer = Buffer.alloc(8);
  marketIdBuffer.writeBigUInt64LE(BigInt(marketId));
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), marketIdBuffer],
    new PublicKey(PROGRAM_ID)
  );
}

export function getMarketVaultPda(marketId: number): [PublicKey, number] {
  const marketIdBuffer = Buffer.alloc(8);
  marketIdBuffer.writeBigUInt64LE(BigInt(marketId));
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), marketIdBuffer],
    new PublicKey(PROGRAM_ID)
  );
}

export function getPositionPda(marketId: number, user: PublicKey): [PublicKey, number] {
  const marketIdBuffer = Buffer.alloc(8);
  marketIdBuffer.writeBigUInt64LE(BigInt(marketId));
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), marketIdBuffer, user.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
}

export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(PROGRAM_ID)
  );
}

