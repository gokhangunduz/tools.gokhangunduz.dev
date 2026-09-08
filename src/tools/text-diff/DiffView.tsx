"use client";

import { Check } from "lucide-react";
import { pick, type Locale, type Localized } from "@/i18n";
import { cn } from "@/lib/utils";
import { collapse, type Segment, type TextDiff } from "./logic";

export type DiffData = { diff: TextDiff; context: number };

const SAME: Localized = { tr: "Metinler aynı", en: "The texts are identical" };
const SKIPPED: Localized = {
  tr: "… {n} satır aynı",
  en: "… {n} unchanged lines",
};
const SKIPPED_ONE: Localized = {
  tr: "… 1 satır aynı",
  en: "… 1 unchanged line",
};

const MARK = { same: " ", added: "+", removed: "−" } as const;

export default function DiffView({
  data,
  locale,
}: {
  data: DiffData;
  locale: Locale;
}) {
  const { diff, context } = data;

  if (diff.added === 0 && diff.removed === 0) {
    return (
      <p className="flex items-center justify-center gap-2 p-6 text-sm text-success">
        <Check className="size-4" />
        {pick(locale, SAME)}
      </p>
    );
  }

  if (diff.mode === "inline") {
    return (
      <p className="whitespace-pre-wrap px-3 py-3 font-mono text-sm leading-6 [overflow-wrap:anywhere]">
        <Inline segments={diff.segments} marked />
      </p>
    );
  }

  const blocks = collapse(diff.rows, context);
  const width = `${String(diff.rows.length).length + 1}ch`;

  return (
    <div className="py-1 font-mono text-[0.8125rem] leading-5">
      {blocks.map((block, index) =>
        block.type === "skip" ? (
          <div
            key={index}
            className="border-y border-border/60 bg-muted/60 px-3 py-1 font-sans text-xs text-muted-foreground tabular"
          >
            {block.count === 1
              ? pick(locale, SKIPPED_ONE)
              : pick(locale, SKIPPED).replace(
                  "{n}",
                  block.count.toLocaleString(locale),
                )}
          </div>
        ) : (
          <div
            key={index}
            className={cn(
              "flex min-w-0",
              block.type === "added" && "bg-success/10",
              block.type === "removed" && "bg-destructive/10",
            )}
          >
            <span
              aria-hidden
              style={{ width }}
              className="shrink-0 select-none pr-1 text-right text-muted-foreground/70 tabular"
            >
              {block.oldNo ?? ""}
            </span>
            <span
              aria-hidden
              style={{ width }}
              className="shrink-0 select-none border-r border-border/60 pr-1 text-right text-muted-foreground/70 tabular"
            >
              {block.newNo ?? ""}
            </span>
            <span
              className={cn(
                "w-5 shrink-0 select-none text-center",
                block.type === "added" && "text-success",
                block.type === "removed" && "text-destructive",
              )}
            >
              {MARK[block.type]}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap pr-3 [overflow-wrap:anywhere]">
              {block.inline ? <Inline segments={block.inline} /> : block.text}
              {!block.text && "​"}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/** `marked` also strikes and underlines, for inline mode where no +/− column says which side a word is from. */
function Inline({
  segments,
  marked = false,
}: {
  segments: Segment[];
  marked?: boolean;
}) {
  return segments.map((segment, index) =>
    segment.type === "added" ? (
      <ins
        key={index}
        className={cn(
          "rounded-sm bg-success/25 text-foreground",
          !marked && "no-underline",
        )}
      >
        {segment.text}
      </ins>
    ) : segment.type === "removed" ? (
      <del
        key={index}
        className={cn(
          "rounded-sm bg-destructive/25 text-foreground",
          !marked && "no-underline",
        )}
      >
        {segment.text}
      </del>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}
