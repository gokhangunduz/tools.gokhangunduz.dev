"use client";

import GeneratorTool from "@/components/GeneratorTool";
import type { Locale } from "@/i18n";
import { spec } from "./spec";

export default function Tool({ locale }: { locale: Locale }) {
  return <GeneratorTool locale={locale} spec={spec} toolId="rsa-key" />;
}
