import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required: Next.js 16 uses Turbopack by default and errors if webpack
  // config exists without a turbopack config. Turbopack handles dynamic
  // imports natively so echarts-gl loads fine without extra config.
  turbopack: {},

  // Keep webpack config for `next build` (production, non-turbopack)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        'echarts-gl',
      ].filter(Boolean);
    }
    return config;
  },
};

export default nextConfig;
