import { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for Prisma to work with Next.js
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  // Optional: Enable React Strict Mode
  reactStrictMode: true,
  // Optional: Configure images if using Next.js Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;