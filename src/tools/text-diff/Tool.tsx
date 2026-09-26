"use client";

import DualTool from "@/components/DualTool";
import type { Locale } from "@/i18n";
import type { DualToolSpec } from "../dual-tool";
import DiffView, { type DiffData } from "./DiffView";
import { spec } from "./spec";

const full: DualToolSpec<DiffData> = {
  ...spec,
  renderOutput: (result, locale) =>
    result.data ? <DiffView data={result.data} locale={locale} /> : null,
};

export default function Tool({ locale }: { locale: Locale }) {
  return <DualTool locale={locale} spec={full} toolId="text-diff" />;
}
