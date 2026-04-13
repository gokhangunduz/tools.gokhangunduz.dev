"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Eraser, Upload } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadBlob } from "@/lib/clipboard";
import {
  defaultValues,
  ToolError,
  type OptionValue,
  type OptionValues,
} from "@/tools/text-tool";
import type { FileResult, FileToolSpec } from "@/tools/file-tool";
import { cn } from "@/lib/utils";

/**
 * Renders a tool whose input is a file.
 *
 * The drop zone is the whole panel rather than a small target, and the file
 * stays in state so that changing an option re-runs the work without asking
 * for it again — which is how "try 60% quality instead" should behave.
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
  const inputRef = useRef<HTMLInputElement>(null);

  // The work is keyed on the file and the options together, so that changing
  // a quality setting re-runs it and a result from a superseded run is
  // recognisable as stale rather than overwriting the current one.
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
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!job) return;
    let live = true;

    void (async () => {
      try {
        const value = await spec.run(job.file, job.values, locale);
        if (live) setDone({ key: job.key, result: value, error: null });
      } catch (cause) {
        if (!live) return;
        setDone({
          key: job.key,
          result: null,
          error:
            cause instanceof ToolError
              ? pick(locale, cause.localized)
              : cause instanceof Error
                ? cause.message
                : String(cause),
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

  // Created alongside the result and revoked when it is replaced, so a long
  // session converting twenty images does not hold all twenty in memory.
  const preview = useMemo(
    () =>
      result?.blob && result.blob.type.startsWith("image/")
        ? URL.createObjectURL(result.blob)
        : null,
    [result],
  );

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const copy = useCallback(async () => {
    if (!result?.text) return;
    if (await copyText(result.text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [result]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            {t(locale, "file.choose")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!file}
            onClick={() => {
              setFile(null);
              setDone(null);
              if (inputRef.current) inputRef.current.value = "";
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

      <input
        ref={inputRef}
        type="file"
        accept={spec.accept}
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files?.[0];
          if (picked) setFile(picked);
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) setFile(dropped);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-foreground/40 bg-accent/60" : "hover:bg-accent/30",
        )}
      >
        <Upload className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {file ? file.name : t(locale, "file.drop")}
        </p>
        {file && (
          <p className="text-xs text-muted-foreground tabular">
            {(file.size / 1024).toFixed(1)} KB · {file.type || "—"}
          </p>
        )}
      </div>

      {(result || error || busy) && (
        <section className="flex flex-col gap-2">
          <header className="flex h-8 items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(locale, "tool.output")}
            </h2>
            <div className="flex items-center gap-1">
              {result?.blob && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    downloadBlob(result.blob!, result.filename ?? "output")
                  }
                >
                  <Download className="size-3.5" />
                  {t(locale, "tool.download")}
                </Button>
              )}
              {result?.text && (
                <Button variant="ghost" size="sm" onClick={copy}>
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? t(locale, "tool.copied") : t(locale, "tool.copy")}
                </Button>
              )}
            </div>
          </header>

          {error ? (
            <p
              role="alert"
              data-tool-error
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </p>
          ) : busy ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              {t(locale, "file.working")}
            </p>
          ) : (
            <>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt=""
                  className="max-h-80 w-fit rounded-md border bg-[repeating-conic-gradient(var(--color-muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] object-contain"
                />
              )}
              {result?.text && (
                <Textarea
                  value={result.text}
                  readOnly
                  className="min-h-32 bg-muted/40"
                />
              )}
              {result?.note && (
                <p className="text-xs text-muted-foreground tabular">
                  {pick(locale, result.note)}
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

/** Identifies a file well enough to tell a re-pick of the same one from a new one. */
function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}
