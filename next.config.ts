import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
