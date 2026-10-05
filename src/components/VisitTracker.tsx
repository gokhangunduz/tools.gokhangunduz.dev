"use client";

import { useEffect } from "react";
import { noteVisit } from "@/lib/storage";

export default function VisitTracker({ toolId }: { toolId: string }) {
  useEffect(() => noteVisit(toolId), [toolId]);
  return null;
}
