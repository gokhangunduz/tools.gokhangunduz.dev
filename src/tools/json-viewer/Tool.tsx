"use client";

import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Eraser,
  FolderOpen,
  Link2,
  Loader2,
  Wand2,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import {
  Frame,
  Pane,
  PaneButton,
  PaneError,
  PaneTextarea,
  Split,
} from "@/components/Panel";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { acceptsFile, offsetAt, type TextPosition } from "../text-tool";
import {
  allKeys,
  groupKey,
  initialKeys,
  isContainer,
  keysPreview,
  nodeJson,
  pathOf,
  revealKeys,
  search,
  flatten,
  type Row,
  type Tree,
} from "./logic";
import { LARGE, parseHere, parseOffThread, type Parsed } from "./parse";

const SAMPLE = `{
  "order": { "id": 1001, "total": 249.9, "paid": true },
  "customer": { "name": "Gökhan Gündüz", "first name": "Gökhan", "city": "İstanbul" },
  "items": [
    { "sku": "A-1", "qty": 2, "tags": ["klavye", "kablosuz"] },
    { "sku": "B-7", "qty": 1, "tags": [] }
  ],
  "trace": 12345678901234567890,
  "note": null
}`;

const ROW = 24;
const OVERSCAN = 8;
const INDENT = 16;
const ACCEPT = ".json,application/json,text/*";

const COPY = {
  tree: { tr: "Ağaç", en: "Tree" },
  placeholder: {
    tr: "JSON yapıştır ya da .json dosyası bırak",
    en: "Paste JSON or drop a .json file",
  },
  search: { tr: "Anahtar ya da değer ara", en: "Search keys or values" },
  matches: (count: number): Localized => ({
    tr: `${count} eşleşme`,
    en: `${count} ${count === 1 ? "match" : "matches"}`,
  }),
  previous: { tr: "Önceki eşleşme", en: "Previous match" },
  next: { tr: "Sonraki eşleşme", en: "Next match" },
  expand: { tr: "Tümünü aç", en: "Expand all" },
  collapse: { tr: "Tümünü kapat", en: "Collapse all" },
  copyPath: { tr: "Yolu kopyala", en: "Copy path" },
  copyValue: { tr: "Değeri kopyala", en: "Copy value" },
  pick: {
    tr: "Bir satır seç; yolu ve değeri buradan kopyalanır.",
    en: "Select a row to copy its path and value here.",
  },
  empty: {
    tr: "Ağaç burada görünecek",
    en: "The tree will appear here",
  },
  items: (count: number): Localized => ({
    tr: `${count} öğe`,
    en: `${count} ${count === 1 ? "item" : "items"}`,
  }),
} as const;

type Cursor = string;

const nodeCursor = (id: number): Cursor => `n${id}`;
const rowCursor = (row: Row): Cursor =>
  row.type === "group"
    ? `g${groupKey(row.id, row.start)}`
    : row.type === "node"
      ? nodeCursor(row.id)
      : `c${row.id}`;

/**
 * A collapsible tree, for the JSON that is too big to read as text.
 *
 * Only the rows on screen are rendered, so a document of a hundred thousand
 * values scrolls like one of ten; large inputs are parsed in a worker.
 */
export default function Tool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("");
  const deferred = useDeferredValue(input);
  const large = deferred.length > LARGE;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const here = useMemo(
    () => (!large && deferred.trim() ? parseHere(deferred) : null),
    [deferred, large],
  );
  const [far, setFar] = useState<{ input: string; parsed: Parsed } | null>(
    null,
  );
  useEffect(() => {
    if (!large) return;
    let live = true;
    void parseOffThread(deferred).then((parsed) => {
      if (live) setFar({ input: deferred, parsed });
    });
    return () => {
      live = false;
    };
  }, [deferred, large]);

  const parsed = large ? (far?.input === deferred ? far.parsed : null) : here;
  const pending = large && parsed === null;
  const error = parsed?.error ?? null;

  const [last, setLast] = useState<Tree | null>(null);
  if (parsed?.tree && parsed.tree !== last) setLast(parsed.tree);
  if (!deferred.trim() && last) setLast(null);
  const tree = parsed?.tree ?? (deferred.trim() ? last : null);
  const stale = tree !== null && tree !== parsed?.tree;

  const [openState, setOpenState] = useState<{
    tree: Tree | null;
    keys: Set<string>;
  }>({ tree: null, keys: new Set() });
  const open = useMemo(
    () =>
      openState.tree === tree
        ? openState.keys
        : new Set(tree ? initialKeys(tree) : []),
    [openState, tree],
  );
  const setOpen = (update: (keys: Set<string>) => Set<string>) =>
    setOpenState({ tree, keys: update(open) });

  const rows = useMemo(() => (tree ? flatten(tree, open) : []), [tree, open]);

  const [cursorState, setCursorState] = useState<{
    tree: Tree | null;
    cursor: Cursor | null;
  }>({ tree: null, cursor: null });
  const cursor = cursorState.tree === tree ? cursorState.cursor : null;
  const setCursor = (next: Cursor | null) =>
    setCursorState({ tree, cursor: next });
  const selected =
    cursor && cursor.startsWith("n") && tree ? Number(cursor.slice(1)) : null;

  const [query, setQuery] = useState("");
  const [matchState, setMatchState] = useState<{
    tree: Tree | null;
    query: string;
    ids: number[];
    index: number;
  } | null>(null);
  const matches =
    matchState && matchState.tree === tree && matchState.query === query
      ? matchState
      : null;
  const matchSet = useMemo(() => new Set(matches?.ids ?? []), [matches]);

  const scroller = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, height: 600 });
  const [scrollTo, setScrollTo] = useState<Cursor | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setView({ top: el.scrollTop, height: el.clientHeight }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tree]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!scrollTo || !el) return;
    const index = rows.findIndex((row) => rowCursor(row) === scrollTo);
    if (index < 0) return;
    const y = index * ROW;
    if (y < el.scrollTop) el.scrollTop = y;
    else if (y + ROW > el.scrollTop + el.clientHeight) {
      el.scrollTop = y + ROW - el.clientHeight;
    }
  }, [scrollTo, rows]);

  const focusRow = (next: Cursor) => {
    setCursor(next);
    setScrollTo(next);
  };

  const reveal = (id: number) => {
    if (!tree) return;
    const keys = revealKeys(tree, id);
    setOpen((current) => new Set([...current, ...keys]));
    focusRow(nodeCursor(id));
  };

  const runSearch = (value: string) => {
    setQuery(value);
    if (!tree) return;
    const ids = search(tree, value, locale);
    setMatchState({ tree, query: value, ids, index: 0 });
    if (ids.length) reveal(ids[0]);
  };

  const step = (delta: number) => {
    if (!matches || matches.ids.length === 0) return;
    const index =
      (matches.index + delta + matches.ids.length) % matches.ids.length;
    setMatchState({ ...matches, index });
    reveal(matches.ids[index]);
  };

  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const flash = (id: string) => {
    setCopied(id);
    window.setTimeout(
      () => setCopied((current) => (current === id ? null : current)),
      1200,
    );
  };

  const copyPath = async (id: number) => {
    if (tree && (await copyText(pathOf(tree, id)))) flash(`path${id}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!tree || rows.length === 0) return;
    const moves = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.type !== "close");
    const at = moves.findIndex(({ row }) => rowCursor(row) === cursor);
    const current = at >= 0 ? moves[at].row : null;
    const go = (index: number) => {
      const target = moves[Math.max(0, Math.min(moves.length - 1, index))];
      if (target) focusRow(rowCursor(target.row));
    };
    const keyOf = (row: Row) =>
      row.type === "group" ? groupKey(row.id, row.start) : String(row.id);
    const expandable = (row: Row) =>
      row.type === "group" ||
      (row.type === "node" &&
        isContainer(tree[row.id]) &&
        tree[row.id].children.length > 0);

    switch (event.key) {
      case "ArrowDown":
        go(at + 1);
        break;
      case "ArrowUp":
        go(at < 0 ? 0 : at - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(moves.length - 1);
        break;
      case "ArrowRight":
        if (!current) go(0);
        else if (expandable(current) && !open.has(keyOf(current))) {
          toggle(keyOf(current));
        } else go(at + 1);
        break;
      case "ArrowLeft": {
        if (!current) break;
        if (expandable(current) && open.has(keyOf(current))) {
          toggle(keyOf(current));
          break;
        }
        const index = moves[at].index;
        for (let i = index - 1; i >= 0; i--) {
          if (rows[i].type !== "close" && rows[i].depth < current.depth) {
            focusRow(rowCursor(rows[i]));
            break;
          }
        }
        break;
      }
      case "Enter":
      case " ":
        if (current && expandable(current)) toggle(keyOf(current));
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const load = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!acceptsFile(file, ACCEPT)) {
      setFileError(t(locale, "tool.fileType", { types: ".json" }));
      return;
    }
    try {
      setInput(await file.text());
      setFileError(null);
    } catch {
      setFileError(t(locale, "tool.fileRead"));
    }
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
      void load(event.dataTransfer.files);
    },
  };

  const goTo = (at: TextPosition) => {
    const field = inputRef.current;
    if (!field) return;
    const offset = offsetAt(field.value, at);
    field.focus({ preventScroll: true });
    field.setSelectionRange(offset, Math.min(offset + 1, field.value.length));
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight) || ROW;
    field.scrollTop = (at.line - 1) * lineHeight - field.clientHeight / 2;
  };

  const first = Math.max(0, Math.floor(view.top / ROW) - OVERSCAN);
  const lastRow = Math.min(
    rows.length,
    Math.ceil((view.top + view.height) / ROW) + OVERSCAN,
  );
  const activeId =
    cursor && rows.some((row) => rowCursor(row) === cursor)
      ? `jv-${cursor}`
      : undefined;

  return (
    <Frame size="split">
      <Split>
        <Pane
          label="JSON"
          className={cn(
            "relative",
            dragging &&
              "after:pointer-events-none after:absolute after:inset-0 after:bg-tint/5 after:ring-2 after:ring-inset after:ring-tint/40",
          )}
          {...drop}
          actions={
            <>
              <PaneButton
                icon={FolderOpen}
                label={t(locale, "tool.openFile")}
                onClick={() => fileRef.current?.click()}
              />
              {!input && (
                <PaneButton
                  icon={Wand2}
                  label={t(locale, "tool.sample")}
                  onClick={() => setInput(SAMPLE)}
                />
              )}
              <PaneButton
                icon={Eraser}
                label={t(locale, "tool.clear")}
                disabled={!input}
                showLabel={false}
                onClick={() => {
                  setInput("");
                  setFileError(null);
                }}
              />
            </>
          }
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              void load(event.target.files);
              event.target.value = "";
            }}
          />
          {fileError && <PaneError>{fileError}</PaneError>}
          <PaneTextarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={pick(locale, COPY.placeholder)}
            aria-label="JSON"
            spellCheck={false}
            wrapMode="off"
            sizing="content"
            className="font-mono text-[13px] leading-6"
            autoFocus
          />
        </Pane>

        <Pane
          label={pick(locale, COPY.tree)}
          className="bg-accent/60"
          badge={
            pending ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : undefined
          }
          actions={
            tree && (
              <>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => runSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      step(event.shiftKey ? -1 : 1);
                    }
                  }}
                  placeholder={pick(locale, COPY.search)}
                  aria-label={pick(locale, COPY.search)}
                  className="h-7 w-28 min-w-0 rounded-md border bg-background px-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 sm:w-44"
                />
                {query.trim() && matches && (
                  <span
                    className="whitespace-nowrap px-1.5 text-xs text-muted-foreground tabular"
                    aria-live="polite"
                  >
                    {matches.ids.length
                      ? `${matches.index + 1}/${matches.ids.length}`
                      : pick(locale, COPY.matches(0))}
                    <span className="sr-only">
                      {pick(locale, COPY.matches(matches.ids.length))}
                    </span>
                  </span>
                )}
                {query.trim() && (matches?.ids.length ?? 0) > 1 && (
                  <>
                    <PaneButton
                      icon={ChevronUp}
                      label={pick(locale, COPY.previous)}
                      showLabel={false}
                      onClick={() => step(-1)}
                    />
                    <PaneButton
                      icon={ChevronDown}
                      label={pick(locale, COPY.next)}
                      showLabel={false}
                      onClick={() => step(1)}
                    />
                  </>
                )}
                <PaneButton
                  icon={ChevronsUpDown}
                  label={pick(locale, COPY.expand)}
                  showLabel={false}
                  onClick={() => setOpen(() => new Set(allKeys(tree)))}
                />
                <PaneButton
                  icon={ChevronsDownUp}
                  label={pick(locale, COPY.collapse)}
                  showLabel={false}
                  onClick={() => setOpen(() => new Set())}
                />
              </>
            )
          }
          footer={
            tree ? (
              selected !== null && tree[selected] ? (
                <span className="flex min-w-0 items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-foreground">
                    {pathOf(tree, selected)}
                  </code>
                  <FooterButton
                    done={copied === "footer-path"}
                    label={pick(locale, COPY.copyPath)}
                    onClick={async () => {
                      if (await copyText(pathOf(tree, selected))) {
                        flash("footer-path");
                      }
                    }}
                  />
                  <FooterButton
                    done={copied === "footer-value"}
                    label={pick(locale, COPY.copyValue)}
                    onClick={async () => {
                      if (await copyText(nodeJson(tree, selected))) {
                        flash("footer-value");
                      }
                    }}
                  />
                </span>
              ) : (
                pick(locale, COPY.pick)
              )
            ) : undefined
          }
        >
          {error && (
            <PaneError>
              {pick(locale, error.detail)}{" "}
              {error.at && (
                <button
                  type="button"
                  onClick={() => error.at && goTo(error.at)}
                  title={t(locale, "tool.goToTitle")}
                  className="whitespace-nowrap font-medium underline decoration-destructive/40 underline-offset-2 tabular hover:decoration-destructive"
                >
                  {t(locale, "tool.goTo", error.at)}
                </button>
              )}
            </PaneError>
          )}
          {tree ? (
            <div
              ref={scroller}
              role="tree"
              aria-label={pick(locale, COPY.tree)}
              aria-activedescendant={activeId}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (!cursor && rows[0]) setCursor(rowCursor(rows[0]));
              }}
              onScroll={(event) =>
                setView({
                  top: event.currentTarget.scrollTop,
                  height: event.currentTarget.clientHeight,
                })
              }
              className={cn(
                "min-h-0 flex-1 overflow-auto py-1 font-mono text-[13px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/20",
                stale && "opacity-60",
              )}
            >
              <div style={{ height: rows.length * ROW }} className="relative">
                <div
                  className="absolute inset-x-0 top-0"
                  style={{ transform: `translateY(${first * ROW}px)` }}
                >
                  {rows.slice(first, lastRow).map((row) => (
                    <TreeRow
                      key={rowCursor(row)}
                      row={row}
                      tree={tree}
                      locale={locale}
                      open={
                        row.type === "group"
                          ? open.has(groupKey(row.id, row.start))
                          : open.has(String(row.id))
                      }
                      active={rowCursor(row) === cursor}
                      match={
                        row.type === "node" && matchSet.has(row.id)
                          ? matches?.ids[matches.index] === row.id
                            ? "current"
                            : "other"
                          : null
                      }
                      pathCopied={copied === `path${row.id}`}
                      copyPathLabel={pick(locale, COPY.copyPath)}
                      onSelect={() => setCursor(rowCursor(row))}
                      onToggle={() =>
                        toggle(
                          row.type === "group"
                            ? groupKey(row.id, row.start)
                            : String(row.id),
                        )
                      }
                      onCopyPath={() => copyPath(row.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            !error && (
              <p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  pick(locale, COPY.empty)
                )}
              </p>
            )
          )}
        </Pane>
      </Split>
    </Frame>
  );
}

function FooterButton({
  done,
  label,
  onClick,
}: {
  done: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      {done ? (
        <Check className="size-3 text-success" />
      ) : (
        <Copy className="size-3" />
      )}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}

function TreeRow({
  row,
  tree,
  locale,
  open,
  active,
  match,
  pathCopied,
  copyPathLabel,
  onSelect,
  onToggle,
  onCopyPath,
}: {
  row: Row;
  tree: Tree;
  locale: Locale;
  open: boolean;
  active: boolean;
  match: "current" | "other" | null;
  pathCopied: boolean;
  copyPathLabel: string;
  onSelect: () => void;
  onToggle: () => void;
  onCopyPath: () => void;
}) {
  const node = tree[row.id];
  const indent = { paddingLeft: row.depth * INDENT };
  const gutter = <span className="size-6 shrink-0" aria-hidden />;

  if (row.type === "close") {
    return (
      <div className="flex h-6 items-center pr-3" aria-hidden>
        {gutter}
        <span style={indent} className="shrink-0" />
        <span className="w-4 shrink-0 text-center text-muted-foreground">
          {node.kind === "object" ? "}" : "]"}
        </span>
      </div>
    );
  }

  const chevron = (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
        onToggle();
      }}
      className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
    >
      <ChevronRight
        className={cn("size-3 transition-transform", open && "rotate-90")}
      />
    </button>
  );

  const rowClass = cn(
    "group flex h-6 cursor-default items-center pr-3",
    active ? "bg-tint/10" : "hover:bg-accent",
    match === "current" && "bg-warning/25",
    match === "other" && !active && "bg-warning/10",
  );

  if (row.type === "group") {
    return (
      <div
        id={`jv-g${groupKey(row.id, row.start)}`}
        role="treeitem"
        aria-level={row.depth + 1}
        aria-expanded={open}
        aria-selected={active}
        onClick={onSelect}
        onDoubleClick={onToggle}
        className={rowClass}
      >
        {gutter}
        <span style={indent} className="shrink-0" />
        {chevron}
        <span className="pl-1 text-muted-foreground tabular">
          [{row.start}…{row.end - 1}]
        </span>
      </div>
    );
  }

  const container = isContainer(node);
  const empty = container && node.children.length === 0;
  const [openBracket, closeBracket] =
    node.kind === "object" ? ["{", "}"] : ["[", "]"];

  return (
    <div
      id={`jv-n${row.id}`}
      role="treeitem"
      aria-level={row.depth + 1}
      aria-expanded={container && !empty ? open : undefined}
      aria-selected={active}
      onClick={onSelect}
      onDoubleClick={container && !empty ? onToggle : undefined}
      className={rowClass}
    >
      <button
        type="button"
        tabIndex={-1}
        title={copyPathLabel}
        aria-label={copyPathLabel}
        onClick={(event) => {
          event.stopPropagation();
          onCopyPath();
        }}
        className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-40 hover:text-foreground group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        {pathCopied ? (
          <Check className="size-3 text-success" />
        ) : (
          <Link2 className="size-3" />
        )}
      </button>
      <span style={indent} className="shrink-0" />
      {container && !empty ? chevron : <span className="w-4 shrink-0" />}
      <span className="flex min-w-0 flex-1 items-center gap-1.5 pl-1">
        {node.key !== null && (
          <span
            className={cn(
              "shrink-0 whitespace-pre",
              typeof node.key === "number"
                ? "text-muted-foreground tabular"
                : "text-foreground",
            )}
          >
            {typeof node.key === "number"
              ? node.key
              : JSON.stringify(node.key).slice(1, -1)}
            <span className="text-muted-foreground">:</span>
          </span>
        )}
        {container ? (
          empty ? (
            <span className="text-muted-foreground">
              {openBracket}
              {closeBracket}
            </span>
          ) : (
            <>
              <span
                className="shrink-0 text-muted-foreground tabular"
                title={pick(locale, COPY.items(node.children.length))}
              >
                {openBracket}
                {node.children.length}
                {closeBracket}
              </span>
              {!open && node.kind === "object" && (
                <span className="min-w-0 truncate font-sans text-xs text-muted-foreground">
                  {keysPreview(tree, row.id)}
                </span>
              )}
            </>
          )
        ) : (
          <Scalar kind={node.kind} value={node.value} />
        )}
      </span>
    </div>
  );
}

function Scalar({
  kind,
  value,
}: {
  kind: Tree[number]["kind"];
  value: string;
}) {
  const text = kind === "string" ? JSON.stringify(value) : value;
  return (
    <span
      title={text.length > 60 ? text : undefined}
      className={cn(
        "min-w-0 truncate",
        kind === "string" && "text-success",
        kind === "number" && "text-info tabular",
        kind === "boolean" && "text-warning",
        kind === "null" && "text-muted-foreground",
      )}
    >
      {text}
    </span>
  );
}
