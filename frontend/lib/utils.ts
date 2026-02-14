import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

/**
 * Generate commitment hash for commit-reveal scheme.
 * SHA256(market_id || user_pubkey || outcome_discriminant || salt)
 *
 * Uses the Web Crypto API (available in all modern browsers).
 */
export async function generateCommitment(
  marketId: number,
  userPubkey: PublicKey,
  outcome: "yes" | "no",
  salt: Uint8Array
): Promise<Uint8Array> {
  const marketIdBytes = Buffer.alloc(8);
  marketIdBytes.writeBigUInt64LE(BigInt(marketId));

  const outcomeByte = outcome === "yes" ? 1 : 2;

  const combined = new Uint8Array([
    ...marketIdBytes,
    ...userPubkey.toBuffer(),
    outcomeByte,
    ...salt,
  ]);

  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", combined);
  return new Uint8Array(hashBuffer);
}

/** Generate 32 random bytes for the commitment salt. */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  globalThis.crypto.getRandomValues(salt);
  return salt;
}

/** Format a unix timestamp (seconds) to a locale string. */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/** Format a number / BN with locale separators. */
export function formatNumber(num: number | string | BN): string {
  const n =
    typeof num === "string"
      ? parseFloat(num)
      : typeof num === "object"
        ? num.toNumber()
        : num;
  return n.toLocaleString();
}

/** Convert an Anchor outcome enum object to a display string. */
export function outcomeToString(outcome: any): string {
  if (outcome === undefined || outcome === null) return "None";
  if (typeof outcome === "object") {
    if ("yes" in outcome) return "Yes";
    if ("no" in outcome) return "No";
    if ("none" in outcome) return "None";
  }
  return String(outcome);
}

/** Convert an Anchor market state enum object to a string (active | resolved | cancelled). */
export function stateToString(state: any): string {
  if (state === undefined || state === null) return "unknown";
  if (typeof state === "string") return state;
  if (typeof state === "object") {
    if ("active" in state) return "active";
    if ("resolved" in state) return "resolved";
    if ("cancelled" in state) return "cancelled";
  }
  return String(state);
}

/** Check whether the connected wallet is the program admin. */
export function isAdmin(userPubkey: PublicKey | null, config: any): boolean {
  if (!userPubkey || !config) return false;
  const adminKey = config.admin;
  if (!adminKey) return false;
  const userStr = userPubkey.toBase58();
  const adminStr = typeof adminKey === "string" ? adminKey : adminKey.toBase58?.() ?? String(adminKey);
  return userStr === adminStr;
}

/** Tailwind classes for a market-state badge. */
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
