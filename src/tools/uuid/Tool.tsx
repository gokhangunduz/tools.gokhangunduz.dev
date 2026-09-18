"use client";

import { useId, useState } from "react";
import GeneratorTool from "@/components/GeneratorTool";
import { Frame } from "@/components/Panel";
import { Input } from "@/components/ui/input";
import { pick, type Locale, type Localized } from "@/i18n";
import { cn } from "@/lib/utils";
import { inspect } from "./logic";
import { spec } from "./spec";

const COPY = {
  label: { tr: "Çözümle", en: "Inspect" },
  placeholder: {
    tr: "Bir UUID ya da ULID yapıştır",
    en: "Paste a UUID or a ULID",
  },
  invalid: {
    tr: "Geçerli bir UUID ya da ULID değil",
    en: "Not a valid UUID or ULID",
  },
  version: { tr: "Sürüm", en: "Version" },
  variant: { tr: "Varyant", en: "Variant" },
  local: { tr: "Yerel saat", en: "Local time" },
  iso: { tr: "ISO", en: "ISO" },
} satisfies Record<string, Localized>;

export default function Tool({ locale }: { locale: Locale }) {
  return (
    <>
      <GeneratorTool locale={locale} spec={spec} toolId="uuid" />
      <Inspector locale={locale} />
    </>
  );
}

function Inspector({ locale }: { locale: Locale }) {
  const id = useId();
  const [value, setValue] = useState("");
  const found = inspect(value);

  const facts: [Localized, string][] = [];
  if (found?.valid) {
    facts.push([COPY.version, pick(locale, found.version)]);
    if (found.variant) facts.push([COPY.variant, pick(locale, found.variant)]);
    if (found.time && !Number.isNaN(found.time.getTime())) {
      facts.push([
        COPY.local,
        found.time.toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "medium",
        }),
      ]);
      facts.push([COPY.iso, found.time.toISOString()]);
    }
  }

  return (
    <Frame size="content" className="shrink-0">
      <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
        <label
          htmlFor={id}
          className="shrink-0 text-xs font-medium text-muted-foreground"
        >
          {pick(locale, COPY.label)}
        </label>
        <Input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={pick(locale, COPY.placeholder)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-invalid={found?.valid === false || undefined}
          className={cn(
            "h-8 font-mono text-sm placeholder:font-sans sm:max-w-sm",
            found?.valid === false &&
              "border-destructive focus-visible:border-destructive",
          )}
        />
        {found && (
          <div
            role="status"
            className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm"
          >
            {found.valid ? (
              facts.map(([label, text]) => (
                <span key={label.en} className="flex min-w-0 gap-1.5">
                  <span className="text-muted-foreground">
                    {pick(locale, label)}
                  </span>
                  <span className="break-all font-mono text-foreground tabular">
                    {text}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-destructive">
                {pick(locale, COPY.invalid)}
              </span>
            )}
          </div>
        )}
      </div>
    </Frame>
  );
}
