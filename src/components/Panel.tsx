"use client";

import * as React from "react";
import { AlertCircle, Check, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Locale, Localized } from "@/i18n";
import { t } from "@/i18n";
import { copyText } from "@/lib/clipboard";
import type { ResultGroup, ResultRow, Tone } from "@/tools/text-tool";
import { cn } from "@/lib/utils";

/**
 * The editor chrome every tool is built from: one bordered frame, an optional
 * toolbar across its top, and panes that each carry their own header bar.
 * Tools share it so that moving between them never changes where the copy
 * button is.
 *
 * `size` decides how the frame takes the page's height: `fill` stretches to
 * it, `content` ends where its content ends, and `split` does that from `md`
 * up with a floor that keeps two empty panes usable. All three shrink to the
 * space the page has, so the panes scroll rather than the page.
 */
export function Frame({
  toolbar,
  children,
  className,
  size = "fill",
}: {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: "fill" | "content" | "split";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-colors focus-within:border-tint/40",
        size === "fill" && "min-h-[26rem] flex-1",
        size === "content" && "min-h-0 flex-initial",
        size === "split" &&
          "min-h-[26rem] flex-1 md:max-h-[calc(100dvh-12rem)] md:min-h-[18rem] md:flex-initial",
        className,
      )}
    >
      {toolbar && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-muted/50 px-3 py-2.5">
          {toolbar}
        </div>
      )}
      {children}
    </div>
  );
}

/** Two panes side by side from `md` up, stacked below it; either way they share the height. */
export function Split({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-0 min-w-0 flex-1 grid-rows-2 divide-y md:grid-cols-2 md:grid-rows-1 md:divide-x md:divide-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pane({
  label,
  badge,
  actions,
  footer,
  children,
  className,
  ...props
}: {
  label: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<"section">, "children">) {
  return (
    <section
      className={cn("flex min-h-0 min-w-0 flex-col", className)}
      {...props}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b pl-3 pr-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </h2>
          {badge}
        </div>
        {actions && <div className="flex items-center">{actions}</div>}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {children}
      </div>
      {footer && <PaneFooter>{footer}</PaneFooter>}
    </section>
  );
}

export function PaneFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "shrink-0 border-t px-3 py-1.5 text-xs text-muted-foreground tabular line-clamp-2 sm:line-clamp-1",
        className,
      )}
    >
      {children}
    </footer>
  );
}

const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

/** A short figure beside a pane label: a size, a saving, a count. */
export function PaneBadge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap rounded-md border px-1.5 py-px font-mono text-[0.6875rem] leading-4 tabular",
        TONE_TEXT[tone],
        tone === "success" && "border-success/30 bg-success/5",
        tone === "warning" && "border-warning/30 bg-warning/5",
        tone === "destructive" && "border-destructive/30 bg-destructive/5",
      )}
    >
      {children}
    </span>
  );
}

export function PaneButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  showLabel = true,
  labelAlways = false,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  labelAlways?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "h-7 px-2 text-muted-foreground hover:text-foreground has-[>svg]:px-2",
        className,
      )}
    >
      <Icon className="size-3.5" />
      <span
        aria-hidden
        className={cn(
          !labelAlways && "sr-only",
          !labelAlways && showLabel && "sm:not-sr-only",
        )}
      >
        {label}
      </span>
    </Button>
  );
}

type PaneTextareaProps = React.ComponentProps<typeof Textarea> & {
  /** `fill` takes the pane's height and scrolls inside; `content` grows with the text and lets the pane scroll. */
  sizing?: "fill" | "content";
  wrapMode?: "soft" | "off" | "anywhere";
  lineNumbers?: boolean;
};

export function PaneTextarea({
  className,
  sizing = "fill",
  wrapMode = "soft",
  lineNumbers = false,
  onScroll,
  ...props
}: PaneTextareaProps) {
  const gutter = React.useRef<HTMLDivElement>(null);
  const textarea = (
    <Textarea
      wrap={wrapMode === "off" ? "off" : undefined}
      onScroll={(event) => {
        if (gutter.current) {
          gutter.current.scrollTop = event.currentTarget.scrollTop;
        }
        onScroll?.(event);
      }}
      className={cn(
        "max-h-none flex-1 resize-none rounded-none border-0 bg-transparent px-3 py-3 focus-visible:ring-0",
        sizing === "fill"
          ? "min-h-0 field-sizing-fixed"
          : "min-h-24 field-sizing-content",
        wrapMode === "off" && "overflow-x-auto whitespace-pre",
        wrapMode === "anywhere" && "break-all [overflow-wrap:anywhere]",
        lineNumbers && "min-w-0 pl-2",
        className,
      )}
      {...props}
    />
  );
  if (!lineNumbers) return textarea;

  const count = Math.max(1, String(props.value ?? "").split("\n").length);
  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <div
        ref={gutter}
        aria-hidden
        className="shrink-0 select-none overflow-hidden whitespace-pre border-r border-border/60 py-3 pl-3 pr-2 text-right font-mono text-[0.6875rem] leading-[1.421875rem] text-muted-foreground/60 tabular"
      >
        {Array.from({ length: count }, (_, i) => i + 1).join("\n")}
      </div>
      {textarea}
    </div>
  );
}

/** One line above whatever the pane still shows, rather than in place of it. */
export function PaneError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      data-tool-error
      className={cn(
        "flex shrink-0 items-start gap-2 border-b border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function label(locale: Locale, value: Localized | string): string {
  return typeof value === "string" ? value : value[locale];
}

/**
 * A result made of named values. Each row copies on its own, since the value
 * wanted is usually one of them rather than the whole list.
 */
export function KeyValueList({
  locale,
  rows = [],
  groups = [],
  className,
}: {
  locale: Locale;
  rows?: ResultRow[];
  groups?: ResultGroup[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col py-1", className)}>
      {rows.length > 0 && <KeyValueRows locale={locale} rows={rows} />}
      {groups.map((group, index) => (
        <section key={index} className="flex flex-col">
          <h3 className="px-3 pb-1 pt-3 text-xs font-medium text-foreground">
            {label(locale, group.label)}
          </h3>
          <KeyValueRows locale={locale} rows={group.rows} />
        </section>
      ))}
    </div>
  );
}

function KeyValueRows({ locale, rows }: { locale: Locale; rows: ResultRow[] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
      {rows.map((row, index) => (
        <KeyValueItem key={index} locale={locale} row={row} />
      ))}
    </dl>
  );
}

function KeyValueItem({ locale, row }: { locale: Locale; row: ResultRow }) {
  const [copied, setCopied] = React.useState(false);
  const name = label(locale, row.label);
  const copyLabel = copied
    ? t(locale, "tool.copied")
    : `${t(locale, "tool.copy")}: ${name}`;

  return (
    <div className="group col-span-2 grid grid-cols-subgrid items-start gap-x-3 px-3 py-1.5 hover:bg-accent/60 sm:col-span-3">
      <dt className="col-start-1 row-start-1 pt-0.5 text-xs text-muted-foreground sm:max-w-56 sm:truncate">
        {name}
      </dt>
      <dd className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
        <span
          className={cn(
            "block break-all font-mono text-sm tabular",
            row.tone ? TONE_TEXT[row.tone] : "text-foreground",
          )}
        >
          {row.value}
        </span>
        {row.hint && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {row.hint[locale]}
          </span>
        )}
      </dd>
      {row.copy !== false && (
        <button
          type="button"
          title={copyLabel}
          aria-label={copyLabel}
          onClick={async () => {
            if (await copyText(row.value)) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }
          }}
          className="col-start-2 row-span-2 row-start-1 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 group-hover:opacity-100 sm:col-start-3 sm:row-span-1 [@media(hover:none)]:opacity-100"
        >
          {copied ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * One choice out of a few. It never wraps: a row that does not fit scrolls
 * sideways under a fade, and below `sm` more than five choices become a
 * native select.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  label?: string;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: false, end: false });

  const measure = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end },
    );
  }, []);

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  React.useEffect(() => {
    const el = scroller.current;
    const active = el?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (!el || !active) return;
    const left = active.offsetLeft;
    if (left < el.scrollLeft) {
      el.scrollLeft = left - 8;
    } else if (left + active.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollLeft = left + active.offsetWidth - el.clientWidth + 8;
    }
    measure();
  }, [value, measure]);

  const fade = "1.25rem";
  const mask =
    edges.start || edges.end
      ? `linear-gradient(to right, ${edges.start ? "transparent" : "black"}, black ${fade}, black calc(100% - ${fade}), ${edges.end ? "transparent" : "black"})`
      : undefined;
  const many = options.length > 5;

  return (
    <>
      {many && (
        <span className="relative sm:hidden">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value as T)}
            aria-label={label}
            className="h-8 appearance-none rounded-md border bg-background pl-2.5 pr-7 text-sm font-medium text-foreground outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/25"
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </span>
      )}
      <div
        ref={scroller}
        role="group"
        aria-label={label}
        onScroll={measure}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className={cn(
          "relative min-w-0 max-w-full flex-nowrap gap-0.5 overflow-x-auto rounded-lg border bg-background p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          many ? "hidden sm:inline-flex" : "inline-flex",
        )}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={option.id === value}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors",
              option.id === value
                ? "bg-tint text-tint-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
