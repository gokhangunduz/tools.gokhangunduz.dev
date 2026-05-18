import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is static and every tool runs in the browser, so the whole site
  // is a folder of files; `/` picks a language in public/index.html.
  output: "export",
  experimental: {
    // Tool pages are prerendered and never go stale, so a visited page comes
    // back instantly instead of round-tripping on every back-navigation.
    staleTimes: { dynamic: 30, static: 300 },
  },
};

export default nextConfig;
