import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Use standalone output only for Docker deployments
  // output: "standalone",

  async rewrites() {
    // Rewrites only work in local dev (same machine) or Docker.
    // On Vercel, the frontend calls the API directly via NEXT_PUBLIC_API_URL.
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
