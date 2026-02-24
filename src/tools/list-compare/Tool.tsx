"use client";

import DualTool from "@/components/DualTool";
import type { Locale } from "@/i18n";
import { spec } from "./spec";

export default function Tool({ locale }: { locale: Locale }) {
  return <DualTool locale={locale} spec={spec} />;
}
