import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@noopdaa/ui", "@noopdaa/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
