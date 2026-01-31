import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Commitment, Transaction } from "@solana/web3.js";
import { useWallets } from "@privy-io/react-auth";
import { useMemo } from "react";
import idl from "./idl.json";
import { PROGRAM_ID, RPC_ENDPOINT } from "@/config/solana";
import { PredictionMarket } from "@/types/prediction_market";
import { createPrivyWalletAdapter } from "./privyWalletAdapter";

const commitment: Commitment = "confirmed";

export function useProgram() {
  const { wallets } = useWallets();
  
  // Find the first Solana wallet
  const solanaWallet = useMemo(() => {
    return wallets.find((w) => w.walletClientType === "privy" && w.chainId.startsWith("solana:"));
  }, [wallets]);

  const program = useMemo(() => {
    if (!solanaWallet) {
      return null;
    }

    try {
      const connection = new Connection(RPC_ENDPOINT, commitment);
      
      // Create Privy-compatible wallet adapter
      const walletAdapter = createPrivyWalletAdapter(solanaWallet as any);
      
      // Create a custom provider that uses Privy's signAndSendTransaction
      const provider = new AnchorProvider(
        connection,
        {
          ...walletAdapter,
          // Override sendAndConfirm to use Privy's signAndSendTransaction
          sendAndConfirm: async (tx: Transaction, signers?: any[]) => {
            if (walletAdapter.signAndSendTransaction) {
              const signature = await walletAdapter.signAndSendTransaction(tx);
              await connection.confirmTransaction(signature, commitment);
              return signature;
            }
            throw new Error("signAndSendTransaction not available");
          },
        } as any,
        { commitment }
      );

      // Create program instance
      // Program constructor: new Program(idl, programId, provider)
      const programIdPubkey = new PublicKey(PROGRAM_ID);
      // TypeScript has issues with Program constructor types, so we use type assertion
      const program = new (Program as any)(
        idl as Idl,
        programIdPubkey,
        provider
      ) as Program<PredictionMarket>;

      return program;
    } catch (error) {
      console.error("Error creating program:", error);
      return null;
    }
  }, [solanaWallet]);

  return { program, wallet: solanaWallet };
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

