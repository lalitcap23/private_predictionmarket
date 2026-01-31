import { Transaction, VersionedTransaction, Connection, PublicKey } from "@solana/web3.js";

// Type for Privy Solana wallet
type PrivySolanaWallet = {
  address: string;
  chainId: string;
  walletClientType: string;
  signAndSendTransaction?: (params: {
    chain: string;
    transaction: number[] | Uint8Array;
  }) => Promise<string>;
  signMessage?: (params: { message: string }) => Promise<string>;
};

/**
 * Helper function to send transactions using Privy wallet
 * Based on Privy's documentation: https://docs.privy.io/guide/react/solana/send-transactions
 */
export async function sendTransactionWithPrivy(
  wallet: PrivySolanaWallet,
  transaction: Transaction | VersionedTransaction,
  connection: Connection
): Promise<string> {
  // Serialize the transaction
  let serialized: Uint8Array;
  
  if (transaction instanceof VersionedTransaction) {
    serialized = transaction.serialize();
  } else {
    serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
  }

  // Use Privy's signAndSendTransaction method
  const result = await wallet.signAndSendTransaction!({
    chain: wallet.chainId,
    transaction: Array.from(serialized),
  });

  return result;
}

/**
 * Helper to build and send a transaction using @solana/web3.js
 */
export async function buildAndSendTransaction(
  wallet: PrivySolanaWallet,
  connection: Connection,
  instructions: any[],
  signers: any[] = []
): Promise<string> {
  const { Transaction, SystemProgram } = await import("@solana/web3.js");
  
  const transaction = new Transaction();
  
  // Add instructions
  instructions.forEach((ix) => transaction.add(ix));
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new PublicKey(wallet.address);
  
  // Sign with any additional signers
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  
  // Send via Privy
  return sendTransactionWithPrivy(wallet, transaction, connection);
}

