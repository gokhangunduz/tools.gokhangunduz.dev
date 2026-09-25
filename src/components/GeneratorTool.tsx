"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadText } from "@/lib/clipboard";
import {
  defaultValues,
  ToolError,
  type OptionValue,
  type OptionValues,
} from "@/tools/text-tool";
import type { GeneratorSpec } from "@/tools/generator-tool";

/**
 * Renders a tool with no input: options, a button, and the result.
 *
 * The generation runs in an effect keyed on a counter as well as the options,
 * so pressing the button again with the same settings produces a new value —
 * which is the whole point of a generator, and something a `useMemo` over the
 * options would quietly refuse to do.
 */
export default function GeneratorTool({
  locale,
  spec,
  toolId,
}: {
  locale: Locale;
  spec: GeneratorSpec;
  toolId: string;
}) {
  const [values, setValues] = useState<OptionValues>(() =>
    defaultValues(spec.options),
  );
  const [nonce, setNonce] = useState(0);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const value = await spec.generate(values, locale);
        if (live) {
          setOutput(value);
          setError(null);
        }
      } catch (cause) {
        if (live) {
          setOutput("");
          setError(
            cause instanceof ToolError
              ? pick(locale, cause.localized)
              : cause instanceof Error
                ? cause.message
                : String(cause),
          );
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [spec, values, locale, nonce]);

  const copy = useCallback(async () => {
    if (!output) return;
    if (await copyText(output)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [output]);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const footnote = output ? (spec.footnote?.(output, values) ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button onClick={() => setNonce((value) => value + 1)}>
          <RefreshCw className="size-4" />
          {t(locale, "tool.generate")}
        </Button>
        <OptionRow
          locale={locale}
          options={spec.options ?? []}
          values={values}
          onChange={setOption}
        />
      </div>

      <section className="flex flex-col gap-2">
        <header className="flex h-8 items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(locale, "tool.output")}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!output}
              onClick={() =>
                downloadText(
                  output,
                  `${toolId}.${spec.outputExtension ?? "txt"}`,
                )
              }
            >
              <Download className="size-3.5" />
              <span className="sr-only sm:not-sr-only">
                {t(locale, "tool.download")}
              </span>
            </Button>
            <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span className="sr-only sm:not-sr-only">
                {copied ? t(locale, "tool.copied") : t(locale, "tool.copy")}
              </span>
            </Button>
          </div>
        </header>

        {error ? (
          <p
            role="alert"
            className="min-h-24 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            {error}
          </p>
        ) : (
          <Textarea value={output} readOnly className="min-h-32 bg-muted/40" />
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
