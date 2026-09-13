import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep generated AI instruction files out of the standalone frontend repository.
  agentRules: false,
};

export default withNextIntl(nextConfig);
