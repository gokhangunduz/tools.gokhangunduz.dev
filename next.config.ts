import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  output: "export",
  experimental: {

    staleTimes: { dynamic: 30, static: 300 },
  },
};

export default nextConfig;
