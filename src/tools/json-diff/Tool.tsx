"use client";

import DualTool from "@/components/DualTool";
import type { Locale } from "@/i18n";
import type { DualToolSpec } from "../dual-tool";
import ChangeList from "./ChangeList";
import type { Change } from "./logic";
import { spec } from "./spec";

const full: DualToolSpec<Change[]> = {
  ...spec,
  renderOutput: (result, locale) =>
    result.data ? <ChangeList changes={result.data} locale={locale} /> : null,
};

export default function Tool({ locale }: { locale: Locale }) {
  return <DualTool locale={locale} spec={full} toolId="json-diff" />;
}
