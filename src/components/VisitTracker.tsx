"use client";

import { useEffect } from "react";
import { noteVisit } from "@/lib/storage";

/**
 * Records that a tool was opened, for the home page's "recently used" row.
 *
 * A component rather than a hook inside the tool, because the page itself is a
 * server component and this is the only thing on it that needs the browser.
 * Nothing is sent anywhere — the list is a localStorage array of slugs.
 */
export default function VisitTracker({ toolId }: { toolId: string }) {
  useEffect(() => noteVisit(toolId), [toolId]);
  return null;
}
