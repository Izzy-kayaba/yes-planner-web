import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep generated AI instruction files out of the standalone frontend repository.
  agentRules: false,
};

export default nextConfig;
