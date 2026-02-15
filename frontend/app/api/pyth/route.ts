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
    // Fetch price update data from Hermes (binary.data is string[] of base64)
    const priceUpdateResponse = await hermesClient.getLatestPriceUpdates(
      [SOL_USD_FEED_ID],
      { encoding: "base64" }
    );

    const priceUpdateDataArray = priceUpdateResponse?.binary?.data;
    if (!priceUpdateDataArray || !Array.isArray(priceUpdateDataArray) || priceUpdateDataArray.length === 0) {
      throw new Error("Hermes returned no price update data for SOL/USD");
    }

    const connection = new Connection(RPC_ENDPOINT, "confirmed");

    // Dummy wallet only used to build the tx and derive account address (we don't send)
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: unknown) => tx,
      signAllTransactions: async (txs: unknown[]) => txs,
    };

    const pythReceiver = new PythSolanaReceiver({
      connection,
      wallet: dummyWallet as any,
    });

    const transactionBuilder = pythReceiver.newTransactionBuilder({
      closeUpdateAccounts: false,
    });

    // Post price updates (SDK: addPostPriceUpdates(priceUpdateDataArray: string[]))
    await transactionBuilder.addPostPriceUpdates(priceUpdateDataArray);

    // Get the SOL/USD price update account address (must match feed id we requested)
    const priceUpdateAccount = transactionBuilder.getPriceUpdateAccount(SOL_USD_FEED_ID);

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

