import { Cluster } from "@solana/web3.js";

export const SOLANA_CLUSTER: Cluster = 
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as Cluster) || "devnet";

export const PROGRAM_ID = 
  process.env.NEXT_PUBLIC_PROGRAM_ID || 
  (SOLANA_CLUSTER === "devnet" 
    ? "6nPzFvBm1Eezmoa82w82XX3L6qNy1StVXDMf7QnF8zv"
    : "GF2HqG2UJWmB7YPGsyqAg1p5wWaRpufKfp9anM7oWTet");

export const RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || 
  (SOLANA_CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "http://127.0.0.1:8899");

// Pyth SOL/USD Feed ID (hardcoded in program)
export const SOL_USD_FEED_ID = 
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

