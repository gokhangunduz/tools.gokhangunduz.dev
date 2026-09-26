"use client";

import { useEffect, useMemo, useState } from "react";
import FileTool from "@/components/FileTool";
import type { Locale } from "@/i18n";
import { probeFormats } from "./logic";
import { makeSpec } from "./spec";

export default function Tool({ locale }: { locale: Locale }) {
  const [supported, setSupported] = useState<Set<string> | null>(null);

  useEffect(() => {
    let live = true;
    void probeFormats().then((formats) => {
      if (live) setSupported(formats);
    });
    return () => {
      live = false;
    };
  }, []);

  const spec = useMemo(() => makeSpec(supported), [supported]);
  return <FileTool locale={locale} spec={spec} />;
}
