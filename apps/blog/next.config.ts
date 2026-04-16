import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@noopdaa/ui", "@noopdaa/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      { source: '/posts/b0cb2817-1dbe-4bdf-810f-bdea7f1230ce', destination: '/posts/dubai-chocolate-cookie-review', permanent: true },
      { source: '/posts/b786377d-a5a7-4462-9d20-8e9e5aeb5343', destination: '/posts/spirited-away-musical-seoul-review', permanent: true },
      { source: '/posts/fb925a87-6b9f-486e-83dc-e2d933813772', destination: '/posts/openclaw-ai-assistant-security', permanent: true },
      { source: '/posts/f8a929e6-3229-459d-9922-a542033855c0', destination: '/posts/moltbook-ai-agent-social-network', permanent: true },
      { source: '/posts/ec2669af-ecc4-4b0e-9631-a6bce67f49f6', destination: '/posts/ghost-of-yotei-review', permanent: true },
      { source: '/posts/1cfcada7-546e-4bdf-89b9-7ce3d961a221', destination: '/posts/stock-average-down-calculator', permanent: true },
    ];
  },
};

export default nextConfig;
