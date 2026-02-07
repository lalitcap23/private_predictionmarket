import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // ── Core fix: stub out Node-only modules that @solana/web3.js tries to pull in ──
      //
      // Even the "browser" build of @solana/web3.js still references rpc-websockets.
      // rpc-websockets in turn imports `ws` (a Node WebSocket lib) via require().
      // In the browser `require` doesn't exist → ReferenceError.
      //
      // Setting fallback to `false` tells webpack:
      //   "If this module is requested, return an empty object instead of bundling it."
      //
      // @solana/web3.js has its own browser WebSocket handling that works fine
      // without the Node `ws` package.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // rpc-websockets & its Node deps
        ws: false,
        bufferutil: false,
        "utf-8-validate": false,
        // Other Node builtins that may leak through
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        // jayson (used by @solana/web3.js for some RPC calls)
        encoding: false,
      };
    }

    return config;
  },

  // Keep Pyth SDK server-side only (used in app/api/pyth/route.ts)
  serverExternalPackages: [
    "@pythnetwork/pyth-solana-receiver",
    "@pythnetwork/solana-utils",
    "@pythnetwork/hermes-client",
    "jito-ts",
  ],
};

export default nextConfig;
