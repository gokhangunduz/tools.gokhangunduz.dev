"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { Check, Copy, Download, Eraser, Wand2 } from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Frame,
  Pane,
  PaneButton,
  PaneTextarea,
  Segmented,
} from "@/components/Panel";
import { copyText, downloadText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import {
  countText,
  htmlDocument,
  indentLines,
  renderMarkdown,
  titleOf,
  wrapSelection,
  type Edit,
} from "./logic";

const SAMPLE: Localized = {
  tr: `# Başlık

Bir **kalın**, bir *eğik* ve bir [bağlantı](https://gokhangunduz.dev).

- [x] biten iş
- [ ] bekleyen iş

| Araç | Durum |
|---|---|
| Markdown | ✓ |

> Alıntı satırı.

<details><summary>Ayrıntı</summary>

Kısayol: <kbd>⌘</kbd> + <kbd>B</kbd>

</details>

\`\`\`ts
const total = items.reduce((sum, item) => sum + item.price, 0);
\`\`\`
`,
  en: `# Heading

A **bold**, an *italic* and a [link](https://gokhangunduz.dev).

- [x] done
- [ ] pending

| Tool | Status |
|---|---|
| Markdown | ✓ |

> A quoted line.

<details><summary>Details</summary>

Shortcut: <kbd>⌘</kbd> + <kbd>B</kbd>

</details>

\`\`\`ts
const total = items.reduce((sum, item) => sum + item.price, 0);
\`\`\`
`,
};

const DRAFT_KEY = "md-editor:draft";
const SAVE_DELAY = 400;
const UNDO_WINDOW = 5000;

const COPY = {
  write: { tr: "Yaz", en: "Write" },
  preview: { tr: "Önizle", en: "Preview" },
  placeholder: {
    tr: "# Başlık, **kalın**, - [ ] görev…",
    en: "# Heading, **bold**, - [ ] task…",
  },
  emptyPreview: {
    tr: "Yazdıkların burada biçimlenmiş görünür",
    en: "What you write shows up here, formatted",
  },
  draft: {
    tr: "Taslak bu tarayıcıda saklanıyor",
    en: "The draft is kept in this browser",
  },
  cleared: { tr: "Temizlendi", en: "Cleared" },
  copyHtml: { tr: "HTML kopyala", en: "Copy HTML" },
  downloadMd: { tr: "Markdown olarak indir", en: "Download as Markdown" },
  downloadHtml: {
    tr: "HTML sayfası olarak indir",
    en: "Download as an HTML page",
  },
  linkText: { tr: "metin", en: "text" },
  counts: (words: number, chars: number, lines: number): Localized => ({
    tr: `${words} kelime · ${chars} karakter · ${lines} satır`,
    en: `${words} ${words === 1 ? "word" : "words"} · ${chars} ${chars === 1 ? "character" : "characters"} · ${lines} ${lines === 1 ? "line" : "lines"}`,
  }),
} as const;

const noop = () => () => {};

function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(value: string) {
  try {
    if (value) localStorage.setItem(DRAFT_KEY, value);
    else localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/**
 * A Markdown editor with the preview beside it.
 *
 * The preview is rendered with the same GitHub dialect as the converter, and
 * its raw HTML is rebuilt from an allowlist before it reaches the page.
 */
export default function Tool({ locale }: { locale: Locale }) {
  const stored = useSyncExternalStore(noop, readDraft, () => "");
  const [typed, setTyped] = useState<string | null>(null);
  const input = typed ?? stored;

  const [rendered, setRendered] = useState({ input: "", html: "" });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [undo, setUndo] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const editor = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const selection = useRef<Edit | null>(null);
  const escaped = useRef(false);
  const syncing = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let live = true;
    void renderMarkdown(input).then((html) => {
      if (live) setRendered({ input, html });
    });
    return () => {
      live = false;
    };
  }, [input]);

  useEffect(() => {
    if (typed === null) return;
    const timer = window.setTimeout(() => writeDraft(typed), SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [typed]);

  useEffect(() => {
    if (undo === null) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_WINDOW);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useLayoutEffect(() => {
    const field = editor.current;
    const next = selection.current;
    if (!field || !next || field.value !== next.text) return;
    field.setSelectionRange(next.start, next.end);
    selection.current = null;
  }, [input]);

  const html = input.trim() ? rendered.html : "";
  const counts = useMemo(() => countText(input), [input]);

  const apply = (edit: Edit) => {
    selection.current = edit;
    setTyped(edit.text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const field = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = field;

    if (event.key === "Escape") {
      escaped.current = true;
      return;
    }
    if (event.key === "Tab") {
      if (escaped.current) {
        escaped.current = false;
        return;
      }
      event.preventDefault();
      apply(indentLines(value, start, end, event.shiftKey));
      return;
    }
    escaped.current = false;

    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
      return;
    }
    const kind =
      event.key === "b"
        ? "bold"
        : event.key === "i"
          ? "italic"
          : event.key === "k"
            ? "link"
            : null;
    if (!kind) return;
    event.preventDefault();
    apply(wrapSelection(value, start, end, kind, pick(locale, COPY.linkText)));
  };

  const follow = (from: HTMLElement, to: HTMLElement | null) => {
    if (!to) return;
    if (syncing.current === from) {
      syncing.current = null;
      return;
    }
    const range = from.scrollHeight - from.clientHeight;
    const ratio = range > 0 ? from.scrollTop / range : 0;
    syncing.current = to;
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
  };

  const flash = (id: string) => {
    setCopied(id);
    window.setTimeout(
      () => setCopied((current) => (current === id ? null : current)),
      1400,
    );
  };

  const title = titleOf(input);

  return (
    <Frame size="split">
      <div className="flex shrink-0 items-center border-b bg-muted/50 px-3 py-2 md:hidden">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { id: "write", label: pick(locale, COPY.write) },
            { id: "preview", label: pick(locale, COPY.preview) },
          ]}
        />
      </div>
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-1 md:grid-cols-2 md:divide-x">
        <Pane
          label="Markdown"
          className={cn(tab !== "write" && "max-md:hidden")}
          actions={
            <>
              {!input && (
                <PaneButton
                  icon={Wand2}
                  label={t(locale, "tool.sample")}
                  onClick={() => setTyped(pick(locale, SAMPLE))}
                />
              )}
              <PaneButton
                icon={copied === "md" ? Check : Copy}
                label={
                  copied === "md"
                    ? t(locale, "tool.copied")
                    : t(locale, "tool.copy")
                }
                disabled={!input}
                showLabel={false}
                onClick={async () => {
                  if (await copyText(input)) flash("md");
                }}
              />
              <PaneButton
                icon={Eraser}
                label={t(locale, "tool.clear")}
                disabled={!input}
                showLabel={false}
                onClick={() => {
                  setUndo(input);
                  setTyped("");
                }}
              />
            </>
          }
          footer={
            undo !== null ? (
              <span className="flex items-center gap-2" role="status">
                {pick(locale, COPY.cleared)}
                <button
                  type="button"
                  onClick={() => {
                    setTyped(undo);
                    setUndo(null);
                  }}
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  {t(locale, "tool.undo")}
                </button>
              </span>
            ) : (
              <span className="tabular">
                {pick(
                  locale,
                  COPY.counts(counts.words, counts.chars, counts.lines),
                )}
                {input && ` · ${pick(locale, COPY.draft)}`}
              </span>
            )
          }
        >
          <PaneTextarea
            ref={editor}
            value={input}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={onKeyDown}
            onScroll={(event) => follow(event.currentTarget, preview.current)}
            placeholder={pick(locale, COPY.placeholder)}
            aria-label="Markdown"
            sizing="content"
            className="font-mono text-[13px] leading-6"
            autoFocus
          />
        </Pane>

        <Pane
          label={t(locale, "tool.preview")}
          className={cn("bg-accent/60", tab !== "preview" && "max-md:hidden")}
          actions={
            <>
              <HeaderButton
                label={pick(locale, COPY.copyHtml)}
                short="HTML"
                icon={copied === "html" ? Check : Copy}
                disabled={!html}
                onClick={async () => {
                  if (await copyText(html)) flash("html");
                }}
              />
              <HeaderButton
                label={pick(locale, COPY.downloadMd)}
                short=".md"
                icon={Download}
                disabled={!input}
                onClick={() =>
                  downloadText(
                    input,
                    "document.md",
                    "text/markdown;charset=utf-8",
                  )
                }
              />
              <HeaderButton
                label={pick(locale, COPY.downloadHtml)}
                short=".html"
                icon={Download}
                disabled={!html}
                onClick={() =>
                  downloadText(
                    htmlDocument(title, html),
                    "document.html",
                    "text/html;charset=utf-8",
                  )
                }
              />
            </>
          }
        >
          {html ? (
            <div
              ref={preview}
              onScroll={(event) => follow(event.currentTarget, editor.current)}
              className="markdown-preview min-h-0 flex-1 overflow-auto px-4 py-3 text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {pick(locale, COPY.emptyPreview)}
            </p>
          )}
        </Pane>
      </div>
    </Frame>
  );
}

function HeaderButton({
  label,
  short,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  short: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-7 gap-1 px-2 text-muted-foreground hover:text-foreground has-[>svg]:px-2"
    >
      <Icon className="size-3.5" />
      <span aria-hidden className="font-mono text-xs">
        {short}
      </span>
    </Button>
  );
}
