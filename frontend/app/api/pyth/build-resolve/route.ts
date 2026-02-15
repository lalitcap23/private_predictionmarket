import { NextResponse } from "next/server";
import { HermesClient } from "@pythnetwork/hermes-client";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { SOL_USD_FEED_ID, RPC_ENDPOINT } from "@/config/solana";
import idl from "@/idl.json";

const hermesClient = new HermesClient("https://hermes.pyth.network/", {});

// Use program id from IDL so PDAs match the deployed program
const PROGRAM_ID = (idl as { address?: string }).address;

function getConfigPda(): PublicKey {
  if (!PROGRAM_ID) throw new Error("IDL missing address");
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

function getMarketPda(marketId: number): PublicKey {
  if (!PROGRAM_ID) throw new Error("IDL missing address");
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(marketId));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), buf],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

/**
 * POST /api/pyth/build-resolve
 * Body: { marketId: number, adminAddress: string }
 * Builds a transaction that: (1) posts Pyth SOL/USD price update, (2) resolves the market.
 * Returns serialized transaction(s) for the client to sign (as admin) and send.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { marketId, adminAddress } = body as { marketId?: number; adminAddress?: string };

    if (typeof marketId !== "number" || !adminAddress || typeof adminAddress !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid marketId or adminAddress" },
        { status: 400 }
      );
    }

    const adminPubkey = new PublicKey(adminAddress);

    // 1) Fetch price update from Hermes
    const priceUpdateResponse = await hermesClient.getLatestPriceUpdates(
      [SOL_USD_FEED_ID],
      { encoding: "base64" }
    );
    const priceUpdateDataArray = priceUpdateResponse?.binary?.data;
    if (
      !priceUpdateDataArray ||
      !Array.isArray(priceUpdateDataArray) ||
      priceUpdateDataArray.length === 0
    ) {
      throw new Error("Hermes returned no price update data for SOL/USD");
    }

    const connection = new Connection(RPC_ENDPOINT, "confirmed");

    // Dummy wallet with admin as fee payer so the built tx has the right signer slot
    const dummyWallet = {
      publicKey: adminPubkey,
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

    await transactionBuilder.addPostPriceUpdates(priceUpdateDataArray);

    // 2) Build resolve_market instruction (Anchor)
    const provider = new AnchorProvider(connection, dummyWallet as any, {
      commitment: "confirmed",
    });
    const program = new Program(idl as any, provider);
    const configPda = getConfigPda();
    const marketPda = getMarketPda(marketId);

    await transactionBuilder.addPriceConsumerInstructions(
      async (getPriceUpdateAccount) => {
        const priceUpdateAccount = getPriceUpdateAccount(SOL_USD_FEED_ID);
        const resolveInstruction = await program.methods
          .resolveMarket(new BN(marketId), { none: {} })
          .accounts({
            admin: adminPubkey,
            config: configPda,
            market: marketPda,
            priceUpdate: priceUpdateAccount,
          })
          .instruction();
        return [{ instruction: resolveInstruction, signers: [] }];
      }
    );

    // 3) Build versioned tx(s) and sign with ephemeral signers (server); client will add admin signature
    const built = await transactionBuilder.buildVersionedTransactions({
      computeUnitPriceMicroLamports: 50000,
    });

    const transactions: string[] = [];
    for (const { tx, signers } of built) {
      const versionedTx = tx as VersionedTransaction;
      if (signers.length > 0) {
        versionedTx.sign(signers);
      }
      transactions.push(Buffer.from(versionedTx.serialize()).toString("base64"));
    }

    return NextResponse.json({
      success: true,
      data: { transactions },
    });
  } catch (error: any) {
    console.error("Error in build-resolve API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to build resolve transaction",
      },
      { status: 500 }
    );
  }
}
