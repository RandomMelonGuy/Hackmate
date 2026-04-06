import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {authInterrupts: true}
  /* config options here */
};

export default nextConfig;
