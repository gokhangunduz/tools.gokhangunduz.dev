"use client";

import FileTool from "@/components/FileTool";
import type { Locale } from "@/i18n";
import { spec } from "./spec";

export default function Tool({ locale }: { locale: Locale }) {
  return <FileTool locale={locale} spec={spec} />;
}
