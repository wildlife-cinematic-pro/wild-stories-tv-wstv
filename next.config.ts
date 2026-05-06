import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: configDir,
  poweredByHeader: false,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  turbopack: {
    root: configDir,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://vercel.com https://*.vercel.com",
          },
        ],
      },
    ];
  },
  // WSTV-AUDIT-FIX: FIX-10 applied
};

export default nextConfig;
