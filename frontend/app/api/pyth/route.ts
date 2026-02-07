import { NextResponse } from "next/server";
import { HermesClient } from "@pythnetwork/hermes-client";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { Connection, PublicKey } from "@solana/web3.js";
import { SOL_USD_FEED_ID, RPC_ENDPOINT } from "@/config/solana";

// Hermes client for fetching price updates (server-only in API route)
const hermesClient = new HermesClient("https://hermes.pyth.network/", {});

/**
 * API route to get Pyth price update account address
 * GET /api/pyth
 * 
 * This route handler is guaranteed to be server-only, so Pyth SDK imports are safe here
 */
export async function GET() {
  try {
    // Fetch price update data
    const priceUpdateData = await hermesClient.getLatestPriceUpdates(
      [SOL_USD_FEED_ID],
      { encoding: "base64" }
    );

    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    
    // Create a minimal wallet adapter for Pyth receiver
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };

    const pythReceiver = new PythSolanaReceiver({
      connection,
      wallet: dummyWallet as any,
    });

    const txBuilder = pythReceiver.newTransactionBuilder({
      closeUpdateAccounts: false,
    });

    // Add price update instruction
    const builder = txBuilder as any;
    if (typeof builder.addPriceUpdateInstruction === "function") {
      await builder.addPriceUpdateInstruction(priceUpdateData.binary.data);
    } else if (typeof builder.addPriceUpdate === "function") {
      await builder.addPriceUpdate(priceUpdateData.binary.data);
    } else {
      throw new Error("Pyth SDK method not found");
    }

    // Get the price update account
    let priceUpdateAccount: PublicKey | null = null;
    
    if (typeof builder.getPriceUpdateAccount === "function") {
      priceUpdateAccount = builder.getPriceUpdateAccount();
    }
    
    if (!priceUpdateAccount) {
      // Fallback: derive from transaction
      const txResults = await builder.buildVersionedTransactions();
      if (!txResults || txResults.length === 0) {
        throw new Error("Failed to build Pyth transaction");
      }
      
      const tx = txResults[0]?.tx || txResults[0];
      const accountKeys = tx.message?.staticAccountKeys || [];
      
      for (const account of accountKeys) {
        if (!account.equals(PublicKey.default)) {
          priceUpdateAccount = account;
          break;
        }
      }
    }
    
    if (!priceUpdateAccount) {
      throw new Error("Failed to extract price update account");
    }

    return NextResponse.json({
      success: true,
      data: {
        priceUpdateAccountAddress: priceUpdateAccount.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error in Pyth API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get Pyth price update account",
      },
      { status: 500 }
    );
  }
}

