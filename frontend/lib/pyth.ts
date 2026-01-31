import { HermesClient } from "@pythnetwork/hermes-client";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SOL_USD_FEED_ID } from "@/config/solana";

// Hermes client for fetching price updates
const hermesClient = new HermesClient("https://hermes.pyth.network/", {});

export async function fetchPythPriceUpdate(): Promise<string[]> {
  try {
    const priceUpdateData = await hermesClient.getLatestPriceUpdates(
      [SOL_USD_FEED_ID],
      { encoding: "base64" }
    );
    return priceUpdateData.binary.data;
  } catch (error) {
    console.error("Error fetching Pyth price update:", error);
    throw error;
  }
}

export async function createPythTransactionBuilder(
  connection: Connection,
  wallet: any
) {
  const pythSolanaReceiver = new PythSolanaReceiver({
    connection,
    wallet,
  });

  return pythSolanaReceiver.newTransactionBuilder({
    closeUpdateAccounts: false,
  });
}

