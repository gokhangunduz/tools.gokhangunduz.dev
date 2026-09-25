"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Eraser, Wand2 } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import OptionRow from "@/components/OptionRow";
import { copyText } from "@/lib/clipboard";
import {
  defaultValues,
  ToolError,
  type OptionValue,
  type OptionValues,
} from "@/tools/text-tool";
import type { DualToolSpec } from "@/tools/dual-tool";
import { cn } from "@/lib/utils";

/**
 * Renders a tool with two inputs and one output.
 *
 * Neither side goes into the URL: a diff of two files is past the length a
 * link should carry, and half a comparison in the address bar would be worse
 * than none. Everything else — the error line, copy, the samples — behaves as
 * it does in the single-input tools, because it is the same page to the
 * person using it.
 */
export default function DualTool({
  locale,
  spec,
}: {
  locale: Locale;
  spec: DualToolSpec;
}) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [values, setValues] = useState<OptionValues>(() =>
    defaultValues(spec.options),
  );
  const [copied, setCopied] = useState(false);

  const computed = useMemo((): {
    output: string;
    error: string | null;
    promise: Promise<string> | null;
  } => {
    if (!left && !right) return { output: "", error: null, promise: null };
    try {
      const value = spec.run(left, right, values);
      return value instanceof Promise
        ? { output: "", error: null, promise: value }
        : { output: value, error: null, promise: null };
    } catch (cause) {
      return { output: "", error: describe(cause, locale), promise: null };
    }
  }, [spec, left, right, values, locale]);

  const [resolved, setResolved] = useState<{
    promise: Promise<string>;
    output: string;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const promise = computed.promise;
    if (!promise) return;
    let live = true;
    promise
      .then((output) => {
        if (live) setResolved({ promise, output, error: null });
      })
      .catch((cause: unknown) => {
        if (live)
          setResolved({ promise, output: "", error: describe(cause, locale) });
      });
    return () => {
      live = false;
    };
  }, [computed, locale]);

  const settled = computed.promise
    ? resolved?.promise === computed.promise
      ? resolved
      : null
    : computed;
  const output = settled?.output ?? "";
  const error = settled?.error ?? null;
  const footnote = output
    ? (spec.footnote?.(left, right, output, values) ?? null)
    : null;

  const copy = useCallback(async () => {
    if (!output) return;
    if (await copyText(output)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [output]);

  const hasSamples = Boolean(spec.left.sample || spec.right.sample);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {hasSamples && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLeft(spec.left.sample ?? "");
                setRight(spec.right.sample ?? "");
              }}
            >
              <Wand2 className="size-3.5" />
              {t(locale, "tool.sample")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={!left && !right}
            onClick={() => {
              setLeft("");
              setRight("");
            }}
          >
            <Eraser className="size-3.5" />
            {t(locale, "tool.clear")}
          </Button>
        </div>
        <OptionRow
          locale={locale}
          options={spec.options ?? []}
          values={values}
          onChange={setOption}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Side
          label={pick(locale, spec.left.label)}
          placeholder={
            spec.left.placeholder && pick(locale, spec.left.placeholder)
          }
          value={left}
          onChange={setLeft}
        />
        <Side
          label={pick(locale, spec.right.label)}
          placeholder={
            spec.right.placeholder && pick(locale, spec.right.placeholder)
          }
          value={right}
          onChange={setRight}
        />
      </div>

      <section className="flex flex-col gap-2">
        <header className="flex h-8 items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(locale, "tool.output")}
          </h2>
          <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? t(locale, "tool.copied") : t(locale, "tool.copy")}
          </Button>
        </header>
        {error ? (
          <p
            role="alert"
            className="min-h-24 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            {error}
          </p>
        ) : (
          <Textarea
            value={output}
            readOnly
            placeholder={t(locale, "tool.emptyOutput")}
            className={cn(
              "min-h-32 bg-muted/40",
              computed.promise && !settled && "opacity-60",
            )}
          />
        )}
        {footnote && !error && (
          <p className="text-xs text-muted-foreground tabular">
            {pick(locale, footnote)}
          </p>
        )}
      </section>
    </div>
  );
}

function Side({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <Textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}

function describe(cause: unknown, locale: Locale): string {
  if (cause instanceof ToolError) return pick(locale, cause.localized);
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
