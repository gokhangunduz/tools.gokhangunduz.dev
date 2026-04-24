"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, in production only.
 *
 * In development it would serve a stale page over the one just edited, which
 * costs more confusion than the offline support is worth while working.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // A blocked registration (private mode, an enterprise policy) costs
        // the offline support and nothing else.
      });
    };

    // After load: registration competes with the page's own resources for
    // bandwidth on a first visit, which is the visit that matters most.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
