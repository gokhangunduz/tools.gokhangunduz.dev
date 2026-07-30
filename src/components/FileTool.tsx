"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from "react";
import {
  Check,
  Copy,
  Download,
  Eraser,
  File as FileIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Frame,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  PaneTextarea,
} from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadBlob } from "@/lib/clipboard";
import { formatBytes, naturalSize } from "@/lib/image";
import {
  defaultValues,
  ToolError,
  visibleOptions,
  type OptionValue,
  type OptionValues,
} from "@/tools/text-tool";
import {
  acceptLabel,
  chooseFile,
  statsHeadline,
  type FileResult,
  type FileToolSpec,
} from "@/tools/file-tool";
import { cn } from "@/lib/utils";

const OUTPUT_SURFACE = "bg-accent/60";
const CHECKER =
  "bg-[repeating-conic-gradient(var(--color-muted)_0_25%,transparent_0_50%)]";

const COPY = {
  drop: (key: string): Localized => ({
    tr: `Dosyayı bırak, yapıştır (${key}) ya da tıkla`,
    en: `Drop a file, paste (${key}) or click`,
  }),
  local: {
    tr: "dosya cihazından çıkmaz",
    en: "the file never leaves your device",
  },
  replace: { tr: "Değiştir", en: "Replace" },
  ignored: (count: number): Localized => ({
    tr: `${count + 1} dosya geldi; yalnız ilki kullanıldı.`,
    en: `${count + 1} files received; only the first was used.`,
  }),
  failed: {
    tr: "Dosya işlenemedi.",
    en: "The file could not be processed.",
  },
} as const;

const noop = () => () => {};

/**
 * Renders a tool whose input is a file.
 *
 * The file stays in state so that changing an option re-runs the work without
 * asking for it again, and the last good result stays on screen, dimmed, while
 * the next one is made.
 */
export default function FileTool({
  locale,
  spec,
}: {
  locale: Locale;
  spec: FileToolSpec;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [values, setValues] = useState<OptionValues>(() =>
    defaultValues(spec.options),
  );
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rejection, setRejection] = useState<Localized | null>(null);
  const [ignored, setIgnored] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteKey = useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘V" : "Ctrl+V"),
    () => "⌘V",
  );

  const job = useMemo(
    () =>
      file
        ? { file, values, key: `${fileKey(file)}|${JSON.stringify(values)}` }
        : null,
    [file, values],
  );

  const [done, setDone] = useState<{
    key: string;
    result: FileResult | null;
    error: Localized | null;
    field?: string;
  } | null>(null);
  const [lastGood, setLastGood] = useState<FileResult | null>(null);

  useEffect(() => {
    if (!job) return;
    let live = true;

    void (async () => {
      try {
        const value = await spec.run(job.file, job.values, locale);
        if (!live) return;
        setDone({ key: job.key, result: value, error: null });
        setLastGood(value);
      } catch (cause) {
        if (!live) return;
        setDone({
          key: job.key,
          result: null,
          error: cause instanceof ToolError ? cause.localized : COPY.failed,
          field: cause instanceof ToolError ? cause.field : undefined,
        });
      }
    })();

    return () => {
      live = false;
    };
  }, [job, spec, locale]);

  const settled = job && done?.key === job.key ? done : null;
  const result = settled?.result ?? null;
  const error = settled?.error ?? null;
  const busy = job !== null && settled === null;
  const view = result ?? (job ? lastGood : null);
  const dim = view !== null && view !== result;

  const take = useCallback(
    (files: readonly File[]) => {
      if (files.length === 0) return false;
      try {
        const chosen = chooseFile(files, spec.accept);
        setFile(chosen.file);
        setIgnored(chosen.ignored);
        setRejection(null);
      } catch (cause) {
        setRejection(
          cause instanceof ToolError ? cause.localized : COPY.failed,
        );
      }
      return true;
    },
    [spec.accept],
  );

  const choose = useCallback(() => inputRef.current?.click(), []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input:not([type=file]), textarea, select"))
      ) {
        return;
      }
      const files = Array.from(event.clipboardData?.files ?? []);
      if (take(files)) event.preventDefault();
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [take]);

  // Revoked when replaced, so a long session does not hold every image in memory.
  const thumb = useMemo(
    () =>
      file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    [file],
  );
  useEffect(() => {
    if (!thumb) return;
    return () => URL.revokeObjectURL(thumb);
  }, [thumb]);

  const [measured, setMeasured] = useState<{
    src: string;
    size: { width: number; height: number } | null;
  } | null>(null);
  useEffect(() => {
    if (!thumb) return;
    let live = true;
    void naturalSize(thumb).then((size) => {
      if (live) setMeasured({ src: thumb, size });
    });
    return () => {
      live = false;
    };
  }, [thumb]);
  const dimensions = measured?.src === thumb ? measured.size : null;

  const blobPreview = useMemo(
    () =>
      !view?.previewUrl && view?.blob && view.blob.type.startsWith("image/")
        ? URL.createObjectURL(view.blob)
        : null,
    [view],
  );
  useEffect(() => {
    if (!blobPreview) return;
    return () => URL.revokeObjectURL(blobPreview);
  }, [blobPreview]);
  const preview = view?.previewUrl ?? blobPreview;

  const setOption = useCallback((id: string, value: OptionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const copy = useCallback(async () => {
    if (!view?.text) return;
    if (await copyText(view.text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [view]);

  const clear = () => {
    setFile(null);
    setDone(null);
    setLastGood(null);
    setRejection(null);
    setIgnored(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const drop = {
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
      event.preventDefault();
      setDragging(false);
      take(Array.from(event.dataTransfer.files));
    },
  };

  const headline = view?.stats ? statsHeadline(view.stats) : null;
  const accepted = pick(locale, acceptLabel(spec.accept));

  return (
    <Frame
      size={file ? "fill" : "content"}
      toolbar={
        <>
          <PaneButton
            icon={Eraser}
            label={t(locale, "tool.clear")}
            disabled={!file && !rejection}
            onClick={clear}
          />
          <OptionRow
            locale={locale}
            options={visibleOptions(spec.options, values)}
            values={values}
            onChange={setOption}
            invalidField={settled?.field}
          />
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={spec.accept}
        className="hidden"
        onChange={(event) => {
          take(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <div
        className={cn(
          "relative flex min-h-0 flex-col",
          file && "flex-1",
          dragging &&
            "after:pointer-events-none after:absolute after:inset-0 after:bg-tint/5 after:ring-2 after:ring-inset after:ring-tint/40",
        )}
        {...drop}
      >
        {rejection && <PaneError>{pick(locale, rejection)}</PaneError>}

        {!file ? (
          <div className="p-3">
            <button
              type="button"
              onClick={choose}
              className="flex max-h-80 min-h-48 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/20 px-4 py-10 text-center outline-none transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:min-h-64"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {pick(locale, COPY.drop(pasteKey))}
              </span>
              <span className="text-xs text-muted-foreground">
                {capitalize(accepted, locale)} · {pick(locale, COPY.local)}
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b px-3 py-2">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[length:8px_8px]",
                  CHECKER,
                )}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : (
                  <FileIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="truncate text-xs text-muted-foreground tabular">
                  {formatBytes(file.size)}
                  {dimensions && ` · ${dimensions.width}×${dimensions.height}`}
                  {file.type && ` · ${file.type}`}
                </p>
                {ignored > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {pick(locale, COPY.ignored(ignored))}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={choose}>
                <Upload className="size-3.5" />
                {pick(locale, COPY.replace)}
              </Button>
            </div>

            <Pane
              label={t(locale, "tool.output")}
              className={cn("min-h-0 flex-1", OUTPUT_SURFACE)}
              badge={
                (headline || busy) && (
                  <>
                    {headline && (
                      <span className={cn(dim && "opacity-60")}>
                        <PaneBadge tone={headline.tone}>
                          {pick(locale, headline.text)}
                        </PaneBadge>
                      </span>
                    )}
                    {busy && view && (
                      <Loader2
                        aria-label={t(locale, "file.working")}
                        className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                      />
                    )}
                  </>
                )
              }
              actions={
                <>
                  {view?.text && (
                    <PaneButton
                      icon={copied ? Check : Copy}
                      label={
                        copied
                          ? t(locale, "tool.copied")
                          : t(locale, "tool.copy")
                      }
                      onClick={copy}
                      disabled={dim}
                    />
                  )}
                  {view?.blob && (
                    <Button
                      size="sm"
                      disabled={dim}
                      title={view.filename}
                      onClick={() =>
                        view.blob &&
                        downloadBlob(view.blob, view.filename ?? "output")
                      }
                      className="ml-1 h-7 max-w-44 gap-1.5 px-2.5 has-[>svg]:px-2.5 sm:max-w-72"
                    >
                      <Download className="size-3.5" />
                      <span className="truncate">
                        {t(locale, "tool.download")}
                        {view.filename && ` · ${view.filename}`}
                      </span>
                    </Button>
                  )}
                </>
              }
              footer={
                view?.note ? (
                  <span className={cn(dim && "opacity-60")}>
                    {pick(locale, view.note)}
                  </span>
                ) : undefined
              }
            >
              {error && <PaneError>{pick(locale, error)}</PaneError>}
              {!view ? (
                !error && (
                  <p
                    role="status"
                    className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
                  >
                    <Loader2 className="size-4 animate-spin" />
                    {t(locale, "file.working")}
                  </p>
                )
              ) : (
                <>
                  {preview && (
                    <div
                      className={cn(
                        "flex items-center justify-center p-3",
                        view.text ? "shrink-0 border-b" : "min-h-0 flex-1",
                        dim && "opacity-60",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt=""
                        className={cn(
                          "max-w-full rounded-md border bg-[length:16px_16px] object-contain",
                          CHECKER,
                          view.text
                            ? "max-h-40"
                            : "max-h-[min(100%,60vh,32rem)]",
                        )}
                      />
                    </div>
                  )}
                  {view.text && (
                    <PaneTextarea
                      value={view.text}
                      readOnly
                      aria-label={t(locale, "tool.output")}
                      wrapMode="anywhere"
                      className={cn("min-h-32", dim && "opacity-60")}
                    />
                  )}
                </>
              )}
            </Pane>
          </>
        )}
      </div>
    </Frame>
  );
}

/** Identifies a file well enough to tell a re-pick of the same one from a new one. */
function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function capitalize(value: string, locale: Locale): string {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}
