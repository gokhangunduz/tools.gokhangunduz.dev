"use client";

import {
  type DragEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowLeftRight,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  FileUp,
  Loader2,
  Search,
  Undo2,
  Wand2,
} from "lucide-react";
import type { Locale } from "@/i18n";
import { pick, t } from "@/i18n";
import {
  Frame,
  KeyValueList,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  PaneFooter,
  PaneTextarea,
  Segmented,
  Split,
} from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { Button } from "@/components/ui/button";
import { copyText, downloadText, readText } from "@/lib/clipboard";
import {
  parseShared,
  readSharedHash,
  subscribeShared,
  writeShared,
} from "@/lib/share";
import { getTool } from "@/tools/registry";
import {
  acceptsFile,
  downloadName,
  measureText,
  offsetAt,
  resolvePerValues,
  restoreValues,
  shareableValues,
  toTextResult,
  ToolError,
  visibleOptions,
  type OptionValue,
  type OptionValues,
  type RunResult,
  type TextPosition,
  type TextResult,
  type TextToolSpec,
  type ToolAction,
} from "@/tools/text-tool";
import { cn } from "@/lib/utils";

const OUTPUT_SURFACE = "bg-accent/60";
const LINE_ERROR_DELAY = 400;
const HEAVY_INPUT = 20_000;
const HEAVY_DELAY = 250;

type Failure = {
  message: string;
  detail: string;
  at?: TextPosition;
  field?: string;
  action?: ToolAction;
};

const noSubscription = () => () => {};

/**
 * Renders any tool that is "text in, text out".
 *
 * The conversion runs on every keystroke, with no debounce. That is the right
 * default for the work these tools do — encoding a paragraph is microseconds —
 * and it is what makes the page feel like a calculator rather than a form.
 * Async directions and inputs over 20 KB wait 250 ms for typing to pause, and
 * network tools (`trigger: "submit"`) run only when asked.
 *
 * A direction that returns a promise (WebCrypto, a wasm hash) is awaited here
 * instead: the last good output stays on screen, dimmed, while the next one is
 * computed, so the panel does not blink empty between keystrokes, and results
 * that arrive out of order are dropped by comparing against the promise that
 * is current. An error keeps that last good output under it for the same
 * reason.
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
  // The fragment is an external store, read straight through rather than
  // copied into state on mount. Once anything is touched, the page wins: the
  // `chosen*` states going from null to a value is the moment the link stops
  // being the source, and all three are taken over together.
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const client = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const shared = useMemo(
    () => (spec.share === false ? null : parseShared(hash)),
    [hash, spec.share],
  );
  const sharedValues = useMemo(
    () => restoreValues(spec.options, shared?.options),
    [spec.options, shared],
  );
  const [typed, setTyped] = useState<string | null>(null);
  const [chosenDirection, setChosenDirection] = useState<string | null>(null);
  const [chosenValues, setChosenValues] = useState<OptionValues | null>(null);
  const input = typed ?? shared?.input ?? "";
  const direction =
    chosenDirection ??
    spec.directions.find((d) => d.id === shared?.direction)?.id ??
    spec.directions[0].id;
  const values = chosenValues ?? sharedValues;
  const [copied, setCopied] = useState(false);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [undo, setUndo] = useState<{
    sample: string;
    previous: string;
    values: OptionValues;
  } | null>(null);
  const [quietInput, setQuietInput] = useState<string | null>(null);
  const [lastGood, setLastGood] = useState<{
    direction: string;
    result: TextResult;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lineId = useId();

  const line = spec.input === "line";
  const active =
    spec.directions.find((d) => d.id === direction) ?? spec.directions[0];
  const submitMode =
    (spec.trigger ?? (getTool(toolId)?.network ? "submit" : "live")) ===
    "submit";
  const shown = visibleOptions(spec.options, values, active.id);

  // A submit tool runs what was last submitted; a link counts as submitted.
  const [submission, setSubmission] = useState<{
    value: string | null;
    count: number;
  } | null>(null);
  const submittedInput = submission
    ? submission.value
    : typed === null && shared?.input
      ? shared.input
      : spec.runOnEmpty
        ? ""
        : null;
  const takeOver = useCallback(() => {
    setChosenDirection((current) => current ?? direction);
    setChosenValues((current) => current ?? values);
  }, [direction, values]);

  const setInput = useCallback(
    (value: string) => {
      takeOver();
      setSubmission(
        (current) => current ?? { value: submittedInput, count: 0 },
      );
      setTyped(value);
      setFileError(null);
    },
    [takeOver, submittedInput],
  );

  const setDirection = useCallback(
    (id: string) => {
      takeOver();
      setChosenDirection(id);
    },
    [takeOver],
  );

  const setValues = useCallback(
    (update: (current: OptionValues) => OptionValues) => {
      setChosenValues((current) => update(current ?? values));
      setChosenDirection((current) => current ?? direction);
    },
    [direction, values],
  );

  // And keep it current afterwards, so the address bar is always the link to
  // send. Replaces rather than pushes: Back should leave the tool, not undo
  // the last keystroke.
  useEffect(() => {
    if (spec.share === false) return;
    const id = window.setTimeout(
      () =>
        writeShared({
          input,
          direction:
            direction === spec.directions[0].id ? undefined : direction,
          options: shareableValues(spec.options, values),
        }),
      300,
    );
    return () => window.clearTimeout(id);
  }, [input, direction, values, spec]);

  const submit = useCallback(
    (value: string | null) => {
      takeOver();
      setSubmission((current) => ({
        value,
        count: (current?.count ?? 0) + 1,
      }));
    },
    [takeOver],
  );

  const [asyncDirections, setAsyncDirections] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const delay = submitMode
    ? 0
    : (active.debounce ??
      (asyncDirections.has(active.id) || input.length > HEAVY_INPUT
        ? HEAVY_DELAY
        : 0));
  const [debounced, setDebounced] = useState(input);
  if (delay === 0 && debounced !== input) setDebounced(input);
  useEffect(() => {
    if (delay === 0) return;
    const id = window.setTimeout(() => setDebounced(input), delay);
    return () => window.clearTimeout(id);
  }, [input, delay]);

  const runInput = submitMode
    ? submittedInput
    : delay === 0
      ? input
      : debounced;
  const runs =
    client &&
    runInput !== null &&
    (runInput !== "" || spec.runOnEmpty === true);
  const ran = runInput ?? "";

  useEffect(() => {
    if (!line) return;
    const id = window.setTimeout(() => setQuietInput(input), LINE_ERROR_DELAY);
    return () => window.clearTimeout(id);
  }, [line, input]);

  // Synchronous directions settle here; async ones hand back the promise for
  // the effect below, which is the only place allowed to call setState.
  const computed = useMemo((): {
    result: TextResult | null;
    error: Failure | null;
    promise: Promise<RunResult> | null;
  } => {
    if (!runs) return { result: null, error: null, promise: null };
    try {
      const value = active.run(ran, values, locale);
      if (value instanceof Promise) {
        // Claim the rejection here, not only in the effect below: React's
        // strict double-render discards the first promise before any effect
        // runs, and an unclaimed rejection surfaces as an uncaught error.
        value.catch(() => {});
        return { result: null, error: null, promise: value };
      }
      return { result: toTextResult(value), error: null, promise: null };
    } catch (cause) {
      return { result: null, error: describe(cause, locale), promise: null };
    }
    // The count is a dependency so that submitting the same value asks again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, runs, ran, values, locale, submission?.count]);

  if (computed.promise && !asyncDirections.has(active.id)) {
    setAsyncDirections(new Set([...asyncDirections, active.id]));
  }

  const [resolved, setResolved] = useState<{
    promise: Promise<RunResult>;
    result: TextResult | null;
    error: Failure | null;
  } | null>(null);

  useEffect(() => {
    const promise = computed.promise;
    if (!promise) return;
    let live = true;
    promise
      .then((value) => {
        if (live) {
          setResolved({ promise, result: toTextResult(value), error: null });
        }
      })
      .catch((cause: unknown) => {
        if (live) {
          setResolved({
            promise,
            result: null,
            error: describe(cause, locale),
          });
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
  const success = settled?.result ?? null;
  const error = settled?.error ?? null;
  const pending = computed.promise !== null && settled === null;
  const busy = pending || (!submitMode && runInput !== input);
  const output = success?.text ?? "";

  if (success && lastGood?.result !== success) {
    setLastGood({ direction: active.id, result: success });
  } else if (!runs && lastGood) {
    setLastGood(null);
  }

  const errorShown =
    error !== null && (!line || submitMode || quietInput === input);
  const previous =
    lastGood && lastGood.direction === active.id ? lastGood.result : null;
  const view = success ?? (runs ? previous : null);
  const stale = !success && view !== null;
  const dim = stale || busy;

  const footnote = success
    ? (active.footnote?.(ran, output, values) ?? null)
    : error && active.footnoteOnError
      ? (active.footnote?.(ran, "", values) ?? null)
      : null;
  const headline = success
    ? (active.headline?.(output, ran, values) ?? null)
    : null;

  const code = resolvePerValues(spec.code ?? false, values);
  const outputWrap = code
    ? "off"
    : (resolvePerValues(active.outputWrap ?? spec.outputWrap, values) ??
      "soft");

  const extension = resolvePerValues(
    active.outputExtension ?? spec.outputExtension ?? "txt",
    values,
  );
  const declaresFile =
    active.outputExtension !== undefined ||
    active.outputFilename !== undefined ||
    spec.outputExtension !== undefined;
  const canDownload = spec.download ?? (!line || declaresFile);
  const filename = sourceName
    ? downloadName({ fallback: toolId, source: sourceName, extension })
    : (active.outputFilename?.(values) ??
      downloadName({ fallback: toolId, extension }));

  const setOption = useCallback(
    (id: string, value: OptionValue) => {
      setValues((current) => ({ ...current, [id]: value }));
    },
    [setValues],
  );

  const runAction = (action: ToolAction) => {
    if (action.values) {
      const next = action.values;
      setValues((current) => ({ ...current, ...next }));
    }
    if (action.direction) setDirection(action.direction);
  };

  const actionButton = (action: ToolAction | undefined, className: string) =>
    action && (
      <button
        type="button"
        onClick={() => runAction(action)}
        className={cn(
          "whitespace-nowrap font-medium underline underline-offset-2",
          className,
        )}
      >
        {pick(locale, action.label)}
      </button>
    );

  const hint = input ? (active.hint?.(input, values) ?? null) : null;

  const reveal = (at: TextPosition) => {
    const field = inputRef.current;
    if (!field) return;
    const offset = offsetAt(field.value, at);
    field.focus({ preventScroll: true });
    field.setSelectionRange(offset, Math.min(offset + 1, field.value.length));
    scrollToLine(field, at.line);
  };

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

  const count = (value: string) => {
    const { chars, bytes, lines } = measureText(value);
    const n = (x: number) => x.toLocaleString(locale);
    return code
      ? `${n(lines)} ${t(locale, "tool.lines")} · ${n(chars)} ${t(locale, "tool.chars")}`
      : `${n(chars)} ${t(locale, "tool.chars")} · ${n(bytes)} ${t(locale, "tool.bytes")}`;
  };

  const openFile = async (file: File) => {
    const accept = spec.acceptFile;
    if (!accept) return;
    if (!acceptsFile(file, accept)) {
      setFileError(
        t(locale, "tool.fileType", {
          types: accept
            .split(",")
            .map((s) => s.trim())
            .join(", "),
        }),
      );
      return;
    }
    try {
      const text = await file.text();
      setInput(text);
      setSourceName(file.name);
      setUndo(null);
    } catch {
      setFileError(t(locale, "tool.fileRead"));
    }
  };

  const sample = active.sample;
  const hasToolbar = spec.directions.length > 1 || (!line && shown.length > 0);
  const focusInput = () => inputRef.current?.focus();
  const placeholder = active.placeholder
    ? pick(locale, active.placeholder)
    : t(locale, "tool.inputPlaceholder");
  const undoable = undo !== null && undo.sample === input;

  const loadSample = (value: string) => {
    setUndo(
      input && input !== value
        ? { sample: value, previous: input, values }
        : null,
    );
    setInput(value);
    setSourceName(null);
    if (active.sampleOptions) {
      setValues((current) => ({ ...current, ...active.sampleOptions }));
    }
    if (submitMode) submit(value);
  };

  const inputActions = (
    <>
      {undoable ? (
        <PaneButton
          icon={Undo2}
          label={t(locale, "tool.undo")}
          labelAlways
          className="h-9 sm:h-7"
          onClick={() => {
            setInput(undo.previous);
            setValues(() => undo.values);
            setUndo(null);
            if (submitMode) submit(undo.previous);
          }}
        />
      ) : (
        sample && (
          <PaneButton
            icon={Wand2}
            label={t(locale, "tool.sample")}
            labelAlways
            className="h-9 sm:h-7"
            disabled={input === sample}
            onClick={() => loadSample(sample)}
          />
        )
      )}
      {spec.acceptFile && !line && (
        <>
          <PaneButton
            icon={FileUp}
            label={t(locale, "tool.openFile")}
            showLabel={false}
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept={spec.acceptFile}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void openFile(file);
            }}
          />
        </>
      )}
      <PaneButton
        icon={ClipboardPaste}
        label={t(locale, "tool.paste")}
        showLabel={!line}
        onClick={async () => {
          const text = await readText();
          if (text !== null) {
            setInput(line ? text.replace(/[\r\n]+/g, "").trim() : text);
          } else focusInput();
        }}
      />
      <PaneButton
        icon={Eraser}
        label={t(locale, "tool.clear")}
        onClick={() => {
          setInput("");
          setSourceName(null);
          setUndo(null);
          if (submitMode) submit(spec.runOnEmpty ? "" : null);
          focusInput();
        }}
        disabled={!input}
        showLabel={false}
      />
      {submitMode && (
        <Button
          size="sm"
          onClick={() => submit(input)}
          disabled={!input && !spec.runOnEmpty}
          aria-label={t(locale, "tool.submit")}
          title={t(locale, "tool.submit")}
          className={cn("ml-1", line ? "h-10" : "h-7")}
        >
          <Search className="size-3.5" />
          <span className="sr-only sm:not-sr-only">
            {t(locale, "tool.submit")}
          </span>
        </Button>
      )}
    </>
  );

  const outputActions = (
    <>
      {canDownload && (
        <PaneButton
          icon={Download}
          label={t(locale, "tool.download")}
          onClick={() => downloadText(output, filename)}
          disabled={!output}
          showLabel={false}
        />
      )}
      <PaneButton
        icon={copied ? Check : Copy}
        label={copied ? t(locale, "tool.copied") : t(locale, "tool.copy")}
        onClick={copy}
        disabled={!output}
      />
    </>
  );

  const spinner = busy && view && (
    <Loader2
      aria-label={t(locale, submitMode ? "tool.pending" : "tool.working")}
      className="size-3.5 shrink-0 animate-spin text-muted-foreground"
    />
  );
  const badge = (headline || spinner) && (
    <>
      {headline && (
        <PaneBadge tone={headline.tone}>
          {pick(locale, headline.text)}
        </PaneBadge>
      )}
      {spinner}
    </>
  );

  const hasRows = (result: TextResult) =>
    (result.rows?.length ?? 0) > 0 || (result.groups?.length ?? 0) > 0;

  const outputBody = (
    <>
      {errorShown && (
        <PaneError>
          {error.at ? (
            <>
              {error.detail}{" "}
              <button
                type="button"
                onClick={() => error.at && reveal(error.at)}
                title={t(locale, "tool.goToTitle")}
                className="whitespace-nowrap font-medium underline decoration-destructive/40 underline-offset-2 tabular hover:decoration-destructive"
              >
                {t(locale, "tool.goTo", error.at)}
              </button>
            </>
          ) : (
            error.message
          )}
          {error.action && " · "}
          {actionButton(
            error.action,
            "decoration-destructive/40 hover:decoration-destructive",
          )}
        </PaneError>
      )}
      {hint && (
        <p className="shrink-0 border-b px-3 py-1.5 text-xs text-muted-foreground">
          {pick(locale, hint.text)}
          {hint.action && " · "}
          {actionButton(
            hint.action,
            "text-foreground decoration-foreground/30 hover:decoration-foreground",
          )}
        </p>
      )}
      {errorShown && !previous ? null : busy && !view ? (
        <p
          role="status"
          className={cn(
            "flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground",
            line && "min-h-32",
          )}
        >
          <Loader2 className="size-4 animate-spin" />
          {t(locale, submitMode ? "tool.pending" : "tool.working")}
        </p>
      ) : view && hasRows(view) ? (
        <KeyValueList
          locale={locale}
          rows={view.rows}
          groups={view.groups}
          className={cn(dim && "opacity-60")}
        />
      ) : (
        <>
          {spec.preview === "svg" && view?.text && (
            <div
              className={cn(
                "flex shrink-0 justify-center border-b p-4",
                dim && "opacity-60",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(view.text)}`}
                alt=""
                className="size-40 sm:size-48"
              />
            </div>
          )}
          <PaneTextarea
            value={view?.text ?? ""}
            readOnly
            sizing="content"
            wrapMode={outputWrap}
            lineNumbers={code}
            placeholder={t(locale, "tool.emptyOutput")}
            aria-label={t(locale, "tool.output")}
            className={cn(
              dim && "opacity-60",
              line && !view?.text && "min-h-32",
            )}
          />
        </>
      )}
    </>
  );

  const optionRow = (
    <OptionRow
      locale={locale}
      options={shown}
      values={values}
      onChange={setOption}
      invalidField={errorShown ? error.field : undefined}
      sharing={spec.share !== false}
    />
  );

  const toolbar = hasToolbar && (
    <>
      {spec.directions.length > 1 ? (
        <div className="flex min-w-0 items-center gap-1">
          <Segmented
            value={direction}
            options={spec.directions.map((option) => ({
              id: option.id,
              label: pick(locale, option.label),
            }))}
            onChange={setDirection}
            label={t(locale, "tool.options")}
          />
          {spec.inverse && (
            <PaneButton
              icon={ArrowLeftRight}
              label={t(locale, "tool.useOutput")}
              showLabel={false}
              disabled={!output || pending}
              onClick={() => {
                const index = spec.directions.indexOf(active);
                const next =
                  spec.directions[(index + 1) % spec.directions.length];
                setInput(output);
                setUndo(null);
                setDirection(next.id);
              }}
            />
          )}
        </div>
      ) : (
        <span />
      )}
      {!line && optionRow}
    </>
  );

  if (line) {
    return (
      <Frame size="content" toolbar={toolbar}>
        <div className="flex shrink-0 items-start gap-2 border-b px-3 py-2">
          <label
            htmlFor={lineId}
            className="hidden h-10 shrink-0 items-center text-xs font-medium text-muted-foreground sm:flex"
          >
            {t(locale, "tool.input")}
          </label>
          <textarea
            id={lineId}
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[\r\n]+/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (submitMode) submit(input);
              }
            }}
            onBlur={() => setQuietInput(input)}
            placeholder={placeholder}
            aria-label={t(locale, "tool.input")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
            className="max-h-[7.125rem] min-h-10 min-w-0 flex-1 resize-none break-all rounded-md border border-input bg-background px-2.5 py-[7px] font-mono text-base leading-6 outline-none transition-colors field-sizing-content placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/10 sm:text-sm"
          />
          <div className="flex h-10 shrink-0 items-center">{inputActions}</div>
        </div>
        {shown.length > 0 && (
          <div className="shrink-0 border-b bg-muted/40 px-3 py-2">
            {optionRow}
          </div>
        )}
        <section
          aria-label={t(locale, "tool.output")}
          className={cn("flex min-h-0 flex-col", OUTPUT_SURFACE)}
        >
          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
              {outputBody}
            </div>
            <div className="flex shrink-0 items-center gap-1 self-start p-1.5">
              {badge}
              {outputActions}
            </div>
          </div>
          {footnote && <PaneFooter>{pick(locale, footnote)}</PaneFooter>}
        </section>
      </Frame>
    );
  }

  const inputFootnote =
    input && spec.inputFootnote ? spec.inputFootnote(input, values) : null;
  const inputFooter = input
    ? inputFootnote
      ? pick(locale, inputFootnote)
      : count(input)
    : undefined;
  const outputFooter = footnote
    ? pick(locale, footnote)
    : runs && success
      ? count(output)
      : undefined;

  const drop = spec.acceptFile
    ? {
        onDragOver: (event: DragEvent) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setDragging(true);
        },
        onDragLeave: (event: DragEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragging(false);
          }
        },
        onDrop: (event: DragEvent) => {
          const file = event.dataTransfer.files[0];
          if (!file) return;
          event.preventDefault();
          setDragging(false);
          void openFile(file);
        },
      }
    : {};

  return (
    <Frame size="split" toolbar={toolbar}>
      <Split>
        <Pane
          label={
            dragging ? t(locale, "tool.dropFile") : t(locale, "tool.input")
          }
          actions={inputActions}
          footer={inputFooter}
          className={cn(dragging && "bg-tint/5 ring-2 ring-inset ring-tint/40")}
          {...drop}
        >
          {fileError && <PaneError>{fileError}</PaneError>}
          <PaneTextarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            aria-label={t(locale, "tool.input")}
            sizing="content"
            wrapMode={code ? "off" : "soft"}
            lineNumbers={code}
            autoFocus
          />
        </Pane>
        <Pane
          label={t(locale, "tool.output")}
          badge={badge}
          className={OUTPUT_SURFACE}
          actions={outputActions}
          footer={outputFooter}
        >
          {outputBody}
        </Pane>
      </Split>
    </Frame>
  );
}

/** Turns anything thrown into a line the user can act on. */
function describe(cause: unknown, locale: Locale): Failure {
  if (cause instanceof ToolError) {
    return {
      message: pick(locale, cause.localized),
      detail: pick(locale, cause.detail),
      at: cause.at,
      field: cause.field,
      action: cause.action,
    };
  }
  const message = t(locale, "tool.unexpectedError");
  return { message, detail: message };
}

/** Brings a line of the input into view, whether the textarea or its pane scrolls. */
function scrollToLine(field: HTMLTextAreaElement, line: number) {
  const style = getComputedStyle(field);
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const y = parseFloat(style.paddingTop) + (line - 1) * lineHeight;
  if (field.scrollHeight > field.clientHeight + 1) {
    field.scrollTop = y - field.clientHeight / 2;
    return;
  }
  let parent = field.parentElement;
  while (parent && parent.scrollHeight <= parent.clientHeight + 1) {
    parent = parent.parentElement;
  }
  if (!parent || parent === document.documentElement) return;
  const top =
    field.getBoundingClientRect().top - parent.getBoundingClientRect().top;
  parent.scrollTop += top + y - parent.clientHeight / 2;
}
