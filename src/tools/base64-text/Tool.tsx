"use client";

import TextTool from "@/components/TextTool";
import type { Locale } from "@/i18n";
import { meta } from "./meta";
import { spec } from "./spec";

export default function Base64TextTool({ locale }: { locale: Locale }) {
  return <TextTool locale={locale} spec={spec} toolId={meta.id} />;
}
