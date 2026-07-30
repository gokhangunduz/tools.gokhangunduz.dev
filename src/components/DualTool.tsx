"use client";

import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  Eraser,
  Loader2,
  Wand2,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import {
  Frame,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  PaneTextarea,
  Segmented,
  Split,
} from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadText } from "@/lib/clipboard";
import {
  defaultValues,
  offsetAt,
  ToolError,
  visibleOptions,
  type OptionValue,
  type OptionValues,
  type TextPosition,
} from "@/tools/text-tool";
import {
  toDualResult,
  type DualHeadline,
  type DualResult,
  type DualToolSpec,
} from "@/tools/dual-tool";
import { cn } from "@/lib/utils";

const OUTPUT_SURFACE = "bg-accent/60";
const SWAP: Localized = { tr: "Tarafları değiştir", en: "Swap sides" };
const WAITING: Localized = {
  tr: 'Karşılaştırmak için "{label}" alanını doldur',
  en: 'Fill in "{label}" to compare',
};

type SideId = "left" | "right";
type Tab = SideId | "output";

type Failure = {
  message: string;
  detail: string;
  at?: TextPosition;
  field?: string;
};

/**
 * Renders a tool with two inputs and one output.
 *
 * Neither side goes into the URL: a diff of two files is past the length a
 * link should carry, and half a comparison in the address bar would be worse
 * than none. Everything else — the error strip over the last good result,
 * copy, the samples — behaves as it does in the single-input tools, because it
 * is the same page to the person using it.
 *
 * Below `md` the three panes do not fit one screen, so they become tabs.
 */
export default function DualTool<T>({
  locale,
  spec,
  toolId,
}: {
  locale: Locale;
  spec: DualToolSpec<T>;
  toolId?: string;
}) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [values, setValues] = useState<OptionValues>(() =>
    defaultValues(spec.options),
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("left");
  const [dragging, setDragging] = useState<SideId | null>(null);
  const [fileError, setFileError] = useState<{
    side: SideId;
    message: string;
  } | null>(null);
  const [lastGood, setLastGood] = useState<DualResult<T> | null>(null);
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const rightRef = useRef<HTMLTextAreaElement>(null);

  const waitingFor: SideId | null =
    spec.bothRequired && (left || right)
      ? !left
        ? "left"
        : !right
          ? "right"
          : null
      : null;
  const runs = Boolean(left || right) && waitingFor === null;

  const computed = useMemo((): {
    result: DualResult<T> | null;
    error: Failure | null;
    promise: Promise<string | DualResult<T>> | null;
  } => {
    if (!runs) return { result: null, error: null, promise: null };
    try {
      const value = spec.run(left, right, values);
      if (value instanceof Promise) {
        // Claim the rejection here, not only in the effect below: React's
        // strict double-render discards the first promise before any effect
        // runs, and an unclaimed rejection surfaces as an uncaught error.
        value.catch(() => {});
        return { result: null, error: null, promise: value };
      }
      return { result: toDualResult(value), error: null, promise: null };
    } catch (cause) {
      return { result: null, error: describe(cause, locale), promise: null };
    }
  }, [spec, runs, left, right, values, locale]);

  const [resolved, setResolved] = useState<{
    promise: Promise<string | DualResult<T>>;
    result: DualResult<T> | null;
    error: Failure | null;
  } | null>(null);

  useEffect(() => {
    const promise = computed.promise;
    if (!promise) return;
    let live = true;
    promise
      .then((value) => {
        if (live)
          setResolved({ promise, result: toDualResult(value), error: null });
      })
      .catch((cause: unknown) => {
        if (live)
          setResolved({
            promise,
            result: null,
            error: describe(cause, locale),
          });
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

  if (success && lastGood !== success) {
    setLastGood(success);
  } else if (!runs && lastGood) {
    setLastGood(null);
  }

  const view = success ?? (runs ? lastGood : null);
  const dim = view !== null && (success === null || pending);
  const output = success?.text ?? "";

  const headline: DualHeadline | null = success
    ? success.headline !== undefined
      ? success.headline
      : toHeadline(spec.footnote?.(left, right, output, values) ?? null)
    : null;

  const copy = useCallback(async (key: string, text: string) => {
    if (!text) return;
    if (await copyText(text)) {
      setCopied(key);
      window.setTimeout(
        () => setCopied((current) => (current === key ? null : current)),
        1400,
      );
    }
  }, []);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const hasSamples = Boolean(spec.left.sample || spec.right.sample);
  const setSide = (side: SideId, value: string) => {
    if (side === "left") setLeft(value);
    else setRight(value);
    setFileError(null);
  };

  const reveal = (side: SideId, at: TextPosition) => {
    const field = (side === "left" ? leftRef : rightRef).current;
    setTab(side);
    if (!field) return;
    const offset = offsetAt(field.value, at);
    field.focus({ preventScroll: true });
    field.setSelectionRange(offset, Math.min(offset + 1, field.value.length));
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight) || 20;
    field.scrollTop = (at.line - 1) * lineHeight - field.clientHeight / 2;
  };

  const drop = (side: SideId) => ({
    onDragOver: (event: DragEvent) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      setDragging(side);
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setDragging(null);
      }
    },
    onDrop: async (event: DragEvent) => {
      const file = event.dataTransfer.files[0];
      if (!file) return;
      event.preventDefault();
      setDragging(null);
      try {
        setSide(side, await file.text());
      } catch {
        setFileError({ side, message: t(locale, "tool.fileRead") });
      }
    },
  });

  const sidePane = (side: SideId) => {
    const config = spec[side];
    const invalid = error?.field === side;
    return (
      <Pane
        label={
          dragging === side
            ? t(locale, "tool.dropFile")
            : pick(locale, config.label)
        }
        actions={
          side === "left" && (
            <PaneButton
              icon={ArrowLeftRight}
              label={pick(locale, SWAP)}
              showLabel={false}
              disabled={!left && !right}
              onClick={() => {
                setLeft(right);
                setRight(left);
                setFileError(null);
              }}
            />
          )
        }
        className={cn(
          tab !== side && "max-md:hidden",
          dragging === side && "bg-tint/5 ring-2 ring-inset ring-tint/40",
          invalid &&
            dragging !== side &&
            "ring-1 ring-inset ring-destructive/50",
        )}
        {...drop(side)}
      >
        {fileError?.side === side && <PaneError>{fileError.message}</PaneError>}
        <PaneTextarea
          ref={side === "left" ? leftRef : rightRef}
          value={side === "left" ? left : right}
          aria-label={pick(locale, config.label)}
          aria-invalid={invalid || undefined}
          placeholder={
            config.placeholder
              ? pick(locale, config.placeholder)
              : t(locale, "tool.inputPlaceholder")
          }
          onChange={(event) => setSide(side, event.target.value)}
        />
      </Pane>
    );
  };

  const errorSide =
    error?.field === "left" || error?.field === "right" ? error.field : null;

  return (
    <Frame
      toolbar={
        <>
          <div className="flex items-center gap-1">
            {hasSamples && (
              <PaneButton
                icon={Wand2}
                label={t(locale, "tool.sample")}
                labelAlways
                onClick={() => {
                  setLeft(spec.left.sample ?? "");
                  setRight(spec.right.sample ?? "");
                  setFileError(null);
                  setTab("output");
                }}
              />
            )}
            <PaneButton
              icon={Eraser}
              label={t(locale, "tool.clear")}
              disabled={!left && !right}
              onClick={() => {
                setLeft("");
                setRight("");
                setFileError(null);
                setTab("left");
              }}
            />
          </div>
          <OptionRow
            locale={locale}
            options={visibleOptions(spec.options, values)}
            values={values}
            onChange={setOption}
            invalidField={error?.field}
          />
        </>
      }
    >
      <div className="flex shrink-0 border-b px-3 py-2 md:hidden">
        <Segmented
          value={tab}
          options={[
            { id: "left", label: pick(locale, spec.left.label) },
            { id: "right", label: pick(locale, spec.right.label) },
            { id: "output", label: t(locale, "tool.output") },
          ]}
          onChange={setTab}
          label={t(locale, "tool.options")}
        />
      </div>

      <Split
        className={cn(
          "max-md:grid-rows-1 max-md:divide-y-0",
          tab === "output" && "max-md:hidden",
        )}
      >
        {sidePane("left")}
        {sidePane("right")}
      </Split>

      <Pane
        label={t(locale, "tool.output")}
        className={cn(
          "min-h-0 flex-1 md:border-t",
          OUTPUT_SURFACE,
          tab !== "output" && "max-md:hidden",
        )}
        badge={
          (headline || pending) && (
            <>
              {headline && (
                <PaneBadge tone={headline.tone}>
                  {pick(locale, headline.text)}
                </PaneBadge>
              )}
              {pending && view && (
                <Loader2
                  aria-label={t(locale, "tool.working")}
                  className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                />
              )}
            </>
          )
        }
        actions={
          <>
            {success?.copies?.map((extra, index) => (
              <PaneButton
                key={index}
                icon={copied === `extra-${index}` ? Check : Copy}
                label={
                  copied === `extra-${index}`
                    ? t(locale, "tool.copied")
                    : pick(locale, extra.label)
                }
                onClick={() => copy(`extra-${index}`, extra.text)}
                disabled={!extra.text}
              />
            ))}
            {spec.outputExtension && (
              <PaneButton
                icon={Download}
                label={t(locale, "tool.download")}
                showLabel={false}
                disabled={!output}
                onClick={() =>
                  downloadText(
                    output,
                    `${toolId ?? "diff"}.${spec.outputExtension}`,
                  )
                }
              />
            )}
            <PaneButton
              icon={copied === "main" ? Check : Copy}
              label={
                copied === "main"
                  ? t(locale, "tool.copied")
                  : t(locale, "tool.copy")
              }
              onClick={() => copy("main", output)}
              disabled={!output}
            />
          </>
        }
      >
        {error && (
          <PaneError>
            {errorSide && error.at ? (
              <>
                {error.detail}{" "}
                <button
                  type="button"
                  onClick={() => error.at && reveal(errorSide, error.at)}
                  title={t(locale, "tool.goToTitle")}
                  className="whitespace-nowrap font-medium underline decoration-destructive/40 underline-offset-2 tabular hover:decoration-destructive"
                >
                  {pick(locale, spec[errorSide].label)} ·{" "}
                  {t(locale, "tool.goTo", error.at)}
                </button>
              </>
            ) : (
              error.message
            )}
          </PaneError>
        )}
        {error && !view ? null : waitingFor ? (
          <p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {pick(locale, WAITING).replace(
              "{label}",
              pick(locale, spec[waitingFor].label),
            )}
          </p>
        ) : pending && !view ? (
          <p
            role="status"
            className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            {t(locale, "tool.working")}
          </p>
        ) : view && spec.renderOutput ? (
          <div className={cn("min-w-0", dim && "opacity-60")}>
            {spec.renderOutput(view, locale)}
          </div>
        ) : (
          <PaneTextarea
            value={view?.text ?? ""}
            readOnly
            aria-label={t(locale, "tool.output")}
            placeholder={t(locale, "tool.emptyOutput")}
            className={cn(dim && "opacity-60")}
          />
        )}
      </Pane>
    </Frame>
  );
}

function toHeadline(
  value: Localized | DualHeadline | null,
): DualHeadline | null {
  if (!value) return null;
  return "text" in value ? value : { text: value };
}

function describe(cause: unknown, locale: Locale): Failure {
  if (cause instanceof ToolError) {
    return {
      message: pick(locale, cause.localized),
      detail: pick(locale, cause.detail),
      at: cause.at,
      field: cause.field,
    };
  }
  const message = t(locale, "tool.unexpectedError");
  return { message, detail: message };
}
