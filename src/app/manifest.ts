import type { MetadataRoute } from "next";

/**
 * Installable, and offline once the service worker has seen a page — the
 * tools themselves need nothing from the network to run.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "tools.gokhangunduz.dev",
    short_name: "tools",
    description:
      "Geliştiriciler için hızlı, reklamsız, tarayıcıda çalışan araçlar / Fast, ad-free developer tools that run in your browser",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
