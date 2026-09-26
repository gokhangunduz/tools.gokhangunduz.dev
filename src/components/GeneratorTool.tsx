"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Frame,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
} from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadText } from "@/lib/clipboard";
import {
  parseToolValues,
  readToolValues,
  writeToolValues,
} from "@/lib/storage";
import {
  restoreValues,
  shareableValues,
  ToolError,
  visibleOptions,
  type OptionValue,
  type OptionValues,
} from "@/tools/text-tool";
import { toGenerated, type GeneratorSpec } from "@/tools/generator-tool";
import { cn } from "@/lib/utils";

const OUTPUT_SURFACE = "bg-accent/60";
const COPY_ALL: Localized = { tr: "Tümünü kopyala", en: "Copy all" };

const noSubscription = () => () => {};

/**
 * Renders a tool with no input: options, a button, and the result.
 *
 * The generation runs in an effect keyed on a counter as well as the options,
 * so pressing the button again with the same settings produces a new value —
 * which is the whole point of a generator, and something a `useMemo` over the
 * options would quietly refuse to do.
 *
 * Settings changed from their defaults are remembered per tool in this
 * browser, secrets excepted. One value is shown large and copies on click;
 * several are a numbered list with a copy button per row.
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
  const stored = useSyncExternalStore(
    noSubscription,
    () => readToolValues(toolId),
    () => null,
  );
  const storedValues = useMemo(
    () => restoreValues(spec.options, parseToolValues(stored)),
    [spec.options, stored],
  );
  const [chosen, setChosen] = useState<OptionValues | null>(null);
  const values = chosen ?? storedValues;
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{
    items: string[];
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();
  const [copied, setCopied] = useState<number | "all" | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const value = toGenerated(await spec.generate(values, locale));
        if (live) {
          setResult(value);
          setError(null);
          setErrorField(undefined);
        }
      } catch (cause) {
        if (live) {
          setErrorField(cause instanceof ToolError ? cause.field : undefined);
          setError(
            cause instanceof ToolError
              ? pick(locale, cause.localized)
              : t(locale, "tool.unexpectedError"),
          );
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [spec, values, locale, nonce]);

  const regenerate = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      const modified = event.metaKey || event.ctrlKey;
      const chord = modified && event.key === "Enter";
      const plain =
        !modified &&
        !event.altKey &&
        !event.repeat &&
        (event.key === "r" || event.key === "R") &&
        !isField(event.target);
      if (!chord && !plain) return;
      event.preventDefault();
      regenerate();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerate]);

  const text = result?.text ?? "";
  const items = result?.items ?? [];

  const copy = useCallback(async (value: string, which: number | "all") => {
    if (!value) return;
    if (await copyText(value)) {
      setCopied(which);
      window.setTimeout(
        () => setCopied((current) => (current === which ? null : current)),
        1400,
      );
    }
  }, []);

  const setOption = useCallback(
    (id: string, value: OptionValue) => {
      const next = { ...values, [id]: value };
      setChosen(next);
      writeToolValues(toolId, shareableValues(spec.options, next));
    },
    [values, toolId, spec.options],
  );

  const footnote =
    text && !error ? (spec.footnote?.(text, values) ?? null) : null;
  const headline =
    text && !error ? (spec.headline?.(text, values) ?? null) : null;
  const single = items.length === 1;
  const copyLabel = (which: number | "all", label: string) =>
    copied === which ? t(locale, "tool.copied") : label;

  return (
    <Frame
      size="content"
      toolbar={
        <>
          <OptionRow
            locale={locale}
            options={visibleOptions(spec.options, values)}
            values={values}
            onChange={setOption}
            invalidField={error ? errorField : undefined}
          />
          <Button
            size="sm"
            onClick={regenerate}
            aria-keyshortcuts="R Control+Enter Meta+Enter"
            className="h-9 w-full bg-tint text-tint-foreground hover:bg-tint/90 sm:ml-auto sm:h-8 sm:w-auto"
          >
            <RefreshCw className="size-3.5" />
            {t(locale, "tool.generate")}
            <kbd className="ml-1 hidden rounded border border-current/30 px-1 font-mono text-[0.625rem] leading-4 opacity-70 sm:inline">
              R
            </kbd>
          </Button>
        </>
      }
    >
      <Pane
        className={OUTPUT_SURFACE}
        label={t(locale, "tool.output")}
        badge={
          headline && (
            <PaneBadge tone={headline.tone}>
              {pick(locale, headline.text)}
            </PaneBadge>
          )
        }
        actions={
          <>
            <PaneButton
              icon={Download}
              label={t(locale, "tool.download")}
              disabled={!text}
              showLabel={false}
              onClick={() =>
                downloadText(text, `${toolId}.${spec.outputExtension ?? "txt"}`)
              }
            />
            <PaneButton
              icon={copied === "all" ? Check : Copy}
              label={copyLabel(
                "all",
                single ? t(locale, "tool.copy") : pick(locale, COPY_ALL),
              )}
              onClick={() => copy(text, "all")}
              disabled={!text}
            />
          </>
        }
        footer={footnote ? pick(locale, footnote) : undefined}
      >
        {error && <PaneError>{error}</PaneError>}
        {single ? (
          <button
            type="button"
            title={t(locale, "tool.copy")}
            onClick={() => copy(items[0], 0)}
            className={cn(
              "group flex min-h-32 flex-col items-center justify-center gap-2 px-4 py-6 text-center outline-none transition-colors hover:bg-accent focus-visible:bg-accent",
              error && "opacity-60",
            )}
          >
            <span className="max-w-full break-all font-mono text-lg text-foreground tabular sm:text-xl">
              {items[0]}
            </span>
            <span className="flex h-4 items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
              {copied === 0 ? (
                <Check className="size-3 text-success" />
              ) : (
                <Copy className="size-3" />
              )}
              {copyLabel(0, t(locale, "tool.copy"))}
            </span>
          </button>
        ) : !result ? (
          !error && <div className="min-h-32" />
        ) : (
          items.length > 0 && (
            <ol className={cn("py-1", error && "opacity-60")}>
              {items.map((item, index) => (
                <li
                  key={index}
                  className="group flex items-center gap-3 py-0.5 pl-3 pr-1.5 hover:bg-accent"
                >
                  <span className="w-[3ch] shrink-0 text-right font-mono text-xs text-muted-foreground/70 tabular select-none">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-all py-1 font-mono text-sm text-foreground tabular">
                    {item}
                  </span>
                  <button
                    type="button"
                    title={copyLabel(
                      index,
                      `${t(locale, "tool.copy")} #${index + 1}`,
                    )}
                    aria-label={copyLabel(
                      index,
                      `${t(locale, "tool.copy")} #${index + 1}`,
                    )}
                    onClick={() => copy(item, index)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    {copied === index ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ol>
          )
        )}
      </Pane>
    </Frame>
  );
}

function isField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
