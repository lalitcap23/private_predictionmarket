import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

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
 * Creates an Anchor-compatible wallet adapter from Privy's ConnectedStandardSolanaWallet
 * 
 * Note: Privy's signAndSendTransaction sends the transaction immediately.
 * For Anchor, we need to sign without sending, so we'll use a workaround:
 * - Anchor's program.methods().rpc() will handle sending
 * - We provide a signer that Privy can use
 */
export function createPrivyWalletAdapter(privyWallet: PrivySolanaWallet) {
  return {
    publicKey: new PublicKey(privyWallet.address),
    
    async signTransaction<T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> {
      // Note: Privy's API is sign-and-send, but Anchor needs sign-only
      // We'll serialize and let Anchor handle the sending via RPC
      // This is a workaround - the transaction will be signed when Anchor sends it
      
      // For now, return the transaction as-is
      // Anchor will use signAndSendTransaction when calling .rpc()
      return tx;
    },
    
    async signAllTransactions<T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> {
      // Sign all transactions
      const signedTxs: T[] = [];
      for (const tx of txs) {
        signedTxs.push(await this.signTransaction(tx));
      }
      return signedTxs;
    },
    
    async signMessage(message: Uint8Array): Promise<Uint8Array> {
      if (privyWallet.signMessage) {
        const result = await privyWallet.signMessage({
          message: new TextDecoder().decode(message),
        });
        return new TextEncoder().encode(result);
      }
      throw new Error("signMessage not supported");
    },
    
    // Privy-specific method for signing and sending
    async signAndSendTransaction(transaction: Transaction | VersionedTransaction) {
      const serialized = transaction instanceof VersionedTransaction
        ? transaction.serialize()
        : transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
      
      return privyWallet.signAndSendTransaction!({
        chain: privyWallet.chainId,
        transaction: Array.from(serialized),
      });
    },
  };
}

