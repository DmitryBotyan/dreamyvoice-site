import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/media/:bucket/:path*",
        destination: `${normalizedApiBaseUrl}/media/:bucket/:path*`,
      },
    ];
  },
};

export default nextConfig;
