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
      // 🔹 Redirect root to homepage
      {
        source: "/",
        destination: "/homepage",
        permanent: false,
      },
      // 🔹 Redirect typo route to correct one
      {
        source: "/professor-annoucement",
        destination: "/professor-announcement",
        permanent: true,
      },
      // (Optional) handle trailing slash too
      {
        source: "/professor-annoucement/",
        destination: "/professor-announcement",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
