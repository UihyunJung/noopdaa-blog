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
  experimental: {
    // /dashboard/media 다중 이미지 업로드용 (FormData 합산 크기)
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
