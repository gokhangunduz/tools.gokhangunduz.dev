"use client";

import type { Locale } from "@/i18n";
import { pick } from "@/i18n";
import { Input } from "@/components/ui/input";
import type { OptionValue, OptionValues, ToolOption } from "@/tools/text-tool";
import { cn } from "@/lib/utils";

/**
 * The options strip above the input.
 *
 * Plain controls rather than a settings panel: there are never more than four
 * of them, and a tool whose switches are hidden behind a disclosure is a tool
 * whose switches nobody finds.
 */
export default function OptionRow({
  locale,
  options,
  values,
  onChange,
}: {
  locale: Locale;
  options: ToolOption[];
  values: OptionValues;
  onChange: (id: string, value: OptionValue) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {options.map((option) => {
        const label = pick(locale, option.label);

        if (option.kind === "switch") {
          return (
            <label
              key={option.id}
              className="flex select-none items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <input
                type="checkbox"
                checked={Boolean(values[option.id])}
                onChange={(e) => onChange(option.id, e.target.checked)}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          );
        }

        if (option.kind === "select") {
          return (
            <label
              key={option.id}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {label}
              <select
                value={String(values[option.id])}
                onChange={(e) => onChange(option.id, e.target.value)}
                className={cn(
                  "h-8 rounded-md border bg-background px-2 text-sm text-foreground outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/25",
                )}
              >
                {option.choices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {pick(locale, choice.label)}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <label
            key={option.id}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {label}
            <Input
              value={String(values[option.id])}
              placeholder={
                option.placeholder
                  ? pick(locale, option.placeholder)
                  : undefined
              }
              onChange={(e) => onChange(option.id, e.target.value)}
              className="h-8 w-44 font-mono text-sm"
            />
          </label>
        );
      })}
    </div>
  );
}
