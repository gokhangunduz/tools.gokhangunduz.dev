"use client";

import TextTool from "@/components/TextTool";
import type { Locale } from "@/i18n";
import { spec } from "./spec";

export default function Tool({ locale }: { locale: Locale }) {
  return <TextTool locale={locale} spec={spec} toolId="cron" />;
}
