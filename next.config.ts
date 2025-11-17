import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow deployment even if lint errors exist; CI/dev should still report them.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", 
      },
      {
        protocol: "http",
        hostname: "localhost", // for testing purposes
      },
      {
        protocol: "https",
        hostname: "ku-company.s3.ap-southeast-1.amazonaws.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/homepage",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
