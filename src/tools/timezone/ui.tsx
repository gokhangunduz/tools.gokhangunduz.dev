"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { t, type Locale } from "@/i18n";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export function CopyButton({
  locale,
  value,
  label,
  className,
  disabled,
}: {
  locale: Locale;
  value: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const title = copied
    ? t(locale, "tool.copied")
    : label
      ? `${t(locale, "tool.copy")}: ${label}`
      : t(locale, "tool.copy");
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled || !value}
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }
      }}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export function useSettled<T>(value: T, delay = 400): boolean {
  const [settled, setSettled] = React.useState(value);
  React.useEffect(() => {
    const id = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return Object.is(settled, value);
}

export function useLastGood<T>(result: T | null, reset: boolean): T | null {
  const [last, setLast] = React.useState<T | null>(null);
  if (result !== null && result !== last) setLast(result);
  else if (reset && last !== null) setLast(null);
  return result ?? (reset ? null : last);
}

export function LineField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      className={cn(
        "h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 font-mono text-base outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/10 aria-invalid:border-destructive sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
