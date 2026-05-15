import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://3.108.119.206:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
