import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import CryptoJS from "crypto-js";

/**
 * Generate commitment hash for commit-reveal scheme
 * SHA256(market_id || user_pubkey || outcome_discriminant || salt)
 */
export function generateCommitment(
  marketId: number,
  userPubkey: PublicKey,
  outcome: "yes" | "no",
  salt: Uint8Array
): Uint8Array {
  const marketIdBytes = Buffer.alloc(8);
  marketIdBytes.writeBigUInt64LE(BigInt(marketId));
  
  const outcomeByte = outcome === "yes" ? 1 : 2;
  
  // Concatenate all bytes
  const combined = Buffer.concat([
    marketIdBytes,
    userPubkey.toBuffer(),
    Buffer.from([outcomeByte]),
    Buffer.from(salt)
  ]);
  
  const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(combined));
  
  return Buffer.from(hash.toString(CryptoJS.enc.Hex), "hex");
}

/**
 * Generate random salt
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | string | BN): string {
  const n = typeof num === "string" ? parseFloat(num) : typeof num === "object" ? num.toNumber() : num;
  return n.toLocaleString();
}

/**
 * Convert outcome enum to string
 */
export function outcomeToString(outcome: any): string {
  if (outcome === undefined || outcome === null) return "None";
  if (typeof outcome === "object") {
    if ("yes" in outcome) return "Yes";
    if ("no" in outcome) return "No";
    if ("none" in outcome) return "None";
  }
  return String(outcome);
}

/**
 * Check if user is admin
 */
export function isAdmin(userPubkey: PublicKey | null, config: any): boolean {
  if (!userPubkey || !config) return false;
  return userPubkey.equals(config.admin);
}

/**
 * Get market state badge color
 */
export function getStateColor(state: string): string {
  switch (state) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
    case "resolved":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
  }
}

