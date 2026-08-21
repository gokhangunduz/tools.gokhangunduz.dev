"use client";

import { useState } from "react";
import { Check, ChevronRight, Copy } from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { PaneBadge } from "@/components/Panel";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { show, type Change } from "./logic";

const KIND: Record<
  Change["kind"],
  { label: Localized; tone: "success" | "destructive" | "muted" }
> = {
  added: { label: { tr: "Eklendi", en: "Added" }, tone: "success" },
  removed: { label: { tr: "Silindi", en: "Removed" }, tone: "destructive" },
  changed: { label: { tr: "Değişti", en: "Changed" }, tone: "muted" },
};

const SAME: Localized = {
  tr: "İki belge aynı",
  en: "The two documents are identical",
};
const PATH: Localized = { tr: "Path'i kopyala", en: "Copy path" };
const VALUE: Localized = { tr: "Değeri kopyala", en: "Copy value" };
const EXPAND: Localized = { tr: "Tamamını göster", en: "Show all" };
const COLLAPSE: Localized = { tr: "Daralt", en: "Collapse" };

export default function ChangeList({
  changes,
  locale,
}: {
  changes: Change[];
  locale: Locale;
}) {
  if (changes.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 p-6 text-sm text-success">
        <Check className="size-4" />
        {pick(locale, SAME)}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/60">
      {changes.map((change, index) => (
        <li key={index} className="flex flex-col gap-1 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <PaneBadge tone={KIND[change.kind].tone}>
              {pick(locale, KIND[change.kind].label)}
            </PaneBadge>
            <code className="min-w-0 flex-1 break-all font-mono text-sm">
              {change.path}
            </code>
            <CopyButton
              value={change.path}
              label={pick(locale, PATH)}
              locale={locale}
            />
          </div>
          {change.kind !== "added" && (
            <Value value={change.left} side="removed" locale={locale} />
          )}
          {change.kind !== "removed" && (
            <Value value={change.right} side="added" locale={locale} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Value({
  value,
  side,
  locale,
}: {
  value: unknown;
  side: "added" | "removed";
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const compact = show(value);
  const pretty = show(value, 2);
  const long = pretty !== compact || compact.length > 80;

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-1.5 rounded-md py-0.5 pl-1.5 pr-0.5 font-mono text-xs leading-6",
        side === "added" ? "bg-success/10" : "bg-destructive/10",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "w-3 shrink-0 select-none text-center",
          side === "added" ? "text-success" : "text-destructive",
        )}
      >
        {side === "added" ? "+" : "−"}
      </span>
      {long ? (
        <button
          type="button"
          aria-expanded={open}
          title={pick(locale, open ? COLLAPSE : EXPAND)}
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-start gap-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <ChevronRight
            className={cn(
              "mt-1.5 size-3 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
          <span
            className={cn(
              "min-w-0 flex-1",
              open
                ? "whitespace-pre-wrap [overflow-wrap:anywhere]"
                : "truncate",
            )}
          >
            {open ? pretty : compact}
          </span>
        </button>
      ) : (
        <span className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {compact}
        </span>
      )}
      <CopyButton value={pretty} label={pick(locale, VALUE)} locale={locale} />
    </div>
  );
}

function CopyButton({
  value,
  label,
  locale,
}: {
  value: string;
  label: string;
  locale: Locale;
}) {
  const [copied, setCopied] = useState(false);
  const title = copied ? t(locale, "tool.copied") : label;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }
      }}
      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
