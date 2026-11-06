import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets a second, separate session be tested on 127.0.0.1 alongside localhost.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
