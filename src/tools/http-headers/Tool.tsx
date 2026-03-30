"use client";

import ReferenceTool from "@/components/ReferenceTool";
import type { Locale } from "@/i18n";
import { spec } from "./spec";

export default function Tool({ locale }: { locale: Locale }) {
  return <ReferenceTool locale={locale} spec={spec} />;
}
