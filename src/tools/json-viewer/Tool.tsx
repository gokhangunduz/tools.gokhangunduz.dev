"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Copy, Check } from "lucide-react";
import { t, type Locale } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

const SAMPLE = `{
  "order": { "id": 1001, "total": 249.9, "paid": true },
  "customer": { "name": "Gökhan Gündüz", "city": "İstanbul" },
  "items": [
    { "sku": "A-1", "qty": 2, "tags": ["klavye", "kablosuz"] },
    { "sku": "B-7", "qty": 1, "tags": [] }
  ],
  "note": null
}`;

/**
 * A collapsible tree, for the JSON that is too big to read as text.
 *
 * Every node shows how many children it has while collapsed, which is the
 * thing a formatter cannot tell you without scrolling: whether that array has
 * three entries or three thousand. Each row carries its own path, so the
 * JSONPath for a value is one click away.
 */
export default function Tool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!input.trim())
      return { value: undefined as unknown, error: null as string | null };
    try {
      return { value: JSON.parse(input) as unknown, error: null };
    } catch (cause) {
      return {
        value: undefined,
        error: cause instanceof Error ? cause.message : String(cause),
      };
    }
  }, [input]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
          {t(locale, "tool.sample")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!input}
          onClick={() => setInput("")}
        >
          {t(locale, "tool.clear")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t(locale, "tool.input")}
          className="min-h-72"
          autoFocus
        />

        <div className="min-h-72 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
          {parsed.error ? (
            <p role="alert" data-tool-error className="text-destructive">
              {parsed.error}
            </p>
          ) : input.trim() ? (
            <Node
              value={parsed.value}
              path="$"
              name={null}
              depth={0}
              onCopyPath={async (path) => {
                if (await copyText(path)) {
                  setCopiedPath(path);
                  window.setTimeout(() => setCopiedPath(null), 1200);
                }
              }}
              copiedPath={copiedPath}
            />
          ) : (
            <p className="font-sans text-sm text-muted-foreground">
              {t(locale, "tool.emptyOutput")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Node({
  value,
  path,
  name,
  depth,
  onCopyPath,
  copiedPath,
}: {
  value: unknown;
  path: string;
  name: string | null;
  depth: number;
  onCopyPath: (path: string) => void;
  copiedPath: string | null;
}) {
  // Two levels open is enough to see the shape without unfolding a large
  // document into an unreadable wall.
  const [open, setOpen] = useState(depth < 2);

  const isArray = Array.isArray(value);
  const isObject = !isArray && typeof value === "object" && value !== null;

  if (!isArray && !isObject) {
    return (
      <div className="group flex items-start gap-2 pl-4">
        {name !== null && (
          <span className="text-muted-foreground">{name}:</span>
        )}
        <Scalar value={value} />
        <PathButton
          path={path}
          onCopy={onCopyPath}
          copied={copiedPath === path}
        />
      </div>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((item, index) => [String(index), item] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div>
      <div className="group flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex items-center gap-1 rounded hover:bg-accent"
        >
          <ChevronRight
            className={cn("size-3 transition-transform", open && "rotate-90")}
          />
          {name !== null && (
            <span className="text-muted-foreground">{name}:</span>
          )}
          <span className="text-foreground/70">
            {isArray ? "[" : "{"}
            {!open && (
              <span className="px-1 text-muted-foreground">
                {entries.length}
              </span>
            )}
            {!open && (isArray ? "]" : "}")}
          </span>
        </button>
        <PathButton
          path={path}
          onCopy={onCopyPath}
          copied={copiedPath === path}
        />
      </div>

      {open && (
        <div className="border-l border-border/60 pl-3">
          {entries.map(([key, item]) => (
            <Node
              key={key}
              value={item}
              name={isArray ? `${key}` : key}
              path={isArray ? `${path}[${key}]` : `${path}.${key}`}
              depth={depth + 1}
              onCopyPath={onCopyPath}
              copiedPath={copiedPath}
            />
          ))}
          <div className="pl-1 text-foreground/70">{isArray ? "]" : "}"}</div>
        </div>
      )}
    </div>
  );
}

function Scalar({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return <span className="text-success">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number")
    return <span className="text-info">{value}</span>;
  if (typeof value === "boolean") {
    return <span className="text-warning">{String(value)}</span>;
  }
  return <span className="text-muted-foreground">null</span>;
}

function PathButton({
  path,
  onCopy,
  copied,
}: {
  path: string;
  onCopy: (path: string) => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      title={path}
      onClick={() => onCopy(path)}
      className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
    >
      {copied ? (
        <Check className="size-3 text-success" />
      ) : (
        <Copy className="size-3 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
}
