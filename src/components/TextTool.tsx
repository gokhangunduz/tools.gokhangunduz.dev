"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  Wand2,
} from "lucide-react";
import type { Locale } from "@/i18n";
import { pick, t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadText, readText } from "@/lib/clipboard";
import { readShared, subscribeShared, writeShared } from "@/lib/share";
import {
  defaultValues,
  ToolError,
  type OptionValue,
  type OptionValues,
  type TextToolSpec,
} from "@/tools/text-tool";
import { cn } from "@/lib/utils";

/**
 * Renders any tool that is "text in, text out".
 *
 * The conversion runs on every keystroke, with no debounce. That is the right
 * default for the work these tools do — encoding a paragraph is microseconds —
 * and it is what makes the page feel like a calculator rather than a form.
 *
 * A direction that returns a promise (WebCrypto, a wasm hash) is awaited here
 * instead: the last resolved output stays on screen while the next one is
 * computed, so the panel does not blink empty between keystrokes, and results
 * that arrive out of order are dropped by comparing against the promise that
 * is current.
 */
export default function TextTool({
  locale,
  spec,
  toolId,
}: {
  locale: Locale;
  spec: TextToolSpec;
  toolId: string;
}) {
  const [direction, setDirection] = useState(spec.directions[0].id);
  // The fragment is an external store, read straight through rather than
  // copied into state on mount. Once anything is typed, that wins: `typed`
  // going from null to a string is the moment the link stops being the source.
  const shared = useSyncExternalStore(subscribeShared, readShared, () => null);
  const [typed, setTyped] = useState<string | null>(null);
  const input = typed ?? shared ?? "";
  const setInput = setTyped;
  const [values, setValues] = useState<OptionValues>(() =>
    defaultValues(spec.options),
  );
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active =
    spec.directions.find((d) => d.id === direction) ?? spec.directions[0];

  // And keep it current afterwards, so the address bar is always the link to
  // send. Replaces rather than pushes: Back should leave the tool, not undo
  // the last keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => writeShared(input), 300);
    return () => window.clearTimeout(id);
  }, [input]);

  // Synchronous directions settle here; async ones hand back the promise for
  // the effect below, which is the only place allowed to call setState.
  const computed = useMemo((): {
    output: string;
    error: string | null;
    promise: Promise<string> | null;
  } => {
    if (!input) return { output: "", error: null, promise: null };
    try {
      const value = active.run(input, values, locale);
      if (value instanceof Promise) {
        // Claim the rejection here, not only in the effect below: React's
        // strict double-render discards the first promise before any effect
        // runs, and an unclaimed rejection surfaces as an uncaught error.
        value.catch(() => {});
        return { output: "", error: null, promise: value };
      }
      return { output: value, error: null, promise: null };
    } catch (cause) {
      return { output: "", error: describe(cause, locale), promise: null };
    }
  }, [active, input, values, locale]);

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
        if (live) {
          setResolved({ promise, output: "", error: describe(cause, locale) });
        }
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
  const pending = computed.promise !== null && settled === null;
  const footnote = output
    ? (active.footnote?.(input, output, values) ?? null)
    : null;

  const setOption = useCallback((id: string, value: OptionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const copy = useCallback(async () => {
    if (!output) return;
    if (await copyText(output)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [output]);

  // Cmd/Ctrl+Shift+C copies the output from anywhere on the page, so the
  // result can be taken without leaving the keyboard or the input box.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key === "C"
      ) {
        event.preventDefault();
        void copy();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy]);

  const sample = active.sample;

  return (
    <div className="flex flex-col gap-4">
      {(spec.directions.length > 1 || (spec.options?.length ?? 0) > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {spec.directions.length > 1 ? (
            <div className="inline-flex rounded-md border p-0.5">
              {spec.directions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDirection(option.id)}
                  aria-pressed={option.id === direction}
                  className={cn(
                    "rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors",
                    option.id === direction
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {pick(locale, option.label)}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <OptionRow
            locale={locale}
            options={spec.options ?? []}
            values={values}
            onChange={setOption}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Pane
          label={t(locale, "tool.input")}
          actions={
            <>
              {sample && (
                <PaneButton
                  icon={Wand2}
                  label={t(locale, "tool.sample")}
                  onClick={() => {
                    setInput(sample);
                    if (active.sampleOptions) {
                      setValues((current) => ({
                        ...current,
                        ...active.sampleOptions,
                      }));
                    }
                  }}
                />
              )}
              <PaneButton
                icon={ClipboardPaste}
                label={t(locale, "tool.paste")}
                onClick={async () => {
                  const text = await readText();
                  if (text !== null) setInput(text);
                  else inputRef.current?.focus();
                }}
              />
              <PaneButton
                icon={Eraser}
                label={t(locale, "tool.clear")}
                onClick={() => {
                  setInput("");
                  inputRef.current?.focus();
                }}
                disabled={!input}
              />
            </>
          }
        >
          <Textarea
            ref={inputRef}
            value={input}
            className="min-h-64 md:min-h-[46vh]"
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              active.placeholder ? pick(locale, active.placeholder) : undefined
            }
            autoFocus
          />
        </Pane>

        <Pane
          label={t(locale, "tool.output")}
          actions={
            <>
              <PaneButton
                icon={Download}
                label={t(locale, "tool.download")}
                onClick={() =>
                  downloadText(
                    output,
                    `${toolId}.${spec.outputExtension ?? "txt"}`,
                  )
                }
                disabled={!output}
              />
              <PaneButton
                icon={copied ? Check : Copy}
                label={
                  copied ? t(locale, "tool.copied") : t(locale, "tool.copy")
                }
                onClick={copy}
                disabled={!output}
              />
            </>
          }
        >
          {error ? (
            <p
              role="alert"
              data-tool-error
              className="min-h-64 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive md:min-h-[46vh]"
            >
              {error}
            </p>
          ) : (
            <Textarea
              value={output}
              readOnly
              placeholder={t(locale, "tool.emptyOutput")}
              className={cn(
                "min-h-64 bg-muted/40 md:min-h-[46vh]",
                pending && "opacity-60",
              )}
            />
          )}
          {footnote && !error && (
            <p className="text-xs text-muted-foreground tabular">
              {pick(locale, footnote)}
            </p>
          )}
        </Pane>
      </div>
    </div>
  );
}

function Pane({
  label,
  actions,
  children,
}: {
  label: string;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex h-8 items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </h2>
        <div className="flex items-center gap-1">{actions}</div>
      </header>
      {children}
    </section>
  );
}

function PaneButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      // The label is present for screen readers at every width and shown from
      // `sm` up; on a phone the row would wrap to two lines with it.
      title={label}
    >
      <Icon className="size-3.5" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Button>
  );
}

/** Turns anything thrown into a line the user can act on. */
function describe(cause: unknown, locale: Locale): string {
  if (cause instanceof ToolError) return pick(locale, cause.localized);
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
