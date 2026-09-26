"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Copy, Check, Eraser, Wand2 } from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import {
  Frame,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  Segmented,
  Split,
} from "@/components/Panel";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { useSharedState } from "../timezone/shared-state";
import { CopyButton, useSettled } from "../timezone/ui";
import {
  columnText,
  FLAGS,
  type Flag,
  type Mode,
  type RegexMatch,
  type RegexRequest,
} from "./logic";
import { useRegex, type Answer } from "./useRegex";

const SHOWN_ROWS = 1000;
const HIGHLIGHTED = 2000;

const DEFAULTS = {
  input: "",
  direction: "matches",
  options: { pattern: "", flags: "g", replacement: "" },
};

const MODES: { id: Mode; label: Localized }[] = [
  { id: "matches", label: { tr: "Eşleşmeler", en: "Matches" } },
  { id: "replace", label: { tr: "Değiştir", en: "Replace" } },
  { id: "split", label: { tr: "Böl", en: "Split" } },
];

const FLAG_HINTS: Record<Flag, Localized> = {
  g: {
    tr: "g — global: Değiştir tüm eşleşmelere uygulanır",
    en: "g — global: Replace applies to every match",
  },
  i: { tr: "i — büyük/küçük harf duyarsız", en: "i — case-insensitive" },
  m: {
    tr: "m — çok satırlı: ^ ve $ her satırda eşleşir",
    en: "m — multiline: ^ and $ match at every line",
  },
  s: {
    tr: "s — dotAll: . satır sonunu da kapsar",
    en: "s — dotAll: . also matches a line break",
  },
  u: {
    tr: "u — Unicode: \\p{…} ve kod noktaları",
    en: "u — Unicode: \\p{…} and code points",
  },
  y: {
    tr: "y — sticky: yalnız son eşleşmenin bittiği yerden",
    en: "y — sticky: only where the last match ended",
  },
};

const TOKENS: { token: string; hint: Localized }[] = [
  { token: "$1", hint: { tr: "1. grup", en: "group 1" } },
  { token: "$<ad>", hint: { tr: "adlı grup", en: "named group" } },
  { token: "$&", hint: { tr: "eşleşmenin tamamı", en: "the whole match" } },
  { token: "$$", hint: { tr: "düz $", en: "a literal $" } },
];

const SAMPLES: Record<
  Mode,
  Record<Locale, { input: string; pattern: string; replacement?: string }>
> = {
  matches: {
    tr: {
      input:
        "Ali: ali.veli@ornek.dev\nAyşe: ayse@x.dev\nDestek: destek@firma.com.tr",
      pattern: "(?<kullanici>[\\w.]+)@(?<alan>[\\w.]+)",
    },
    en: {
      input:
        "Ali: ali.veli@example.dev\nAyşe: ayse@x.dev\nSupport: help@company.co.uk",
      pattern: "(?<user>[\\w.]+)@(?<domain>[\\w.]+)",
    },
  },
  replace: {
    tr: {
      input: "Teslim: 2026-09-25\nFatura: 2026-10-01",
      pattern: "(?<yil>\\d{4})-(?<ay>\\d{2})-(?<gun>\\d{2})",
      replacement: "$<gun>.$<ay>.$<yil>",
    },
    en: {
      input: "Delivery: 2026-09-25\nInvoice: 2026-10-01",
      pattern: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
      replacement: "$<day>/$<month>/$<year>",
    },
  },
  split: {
    tr: { input: "elma, armut;kiraz ,  muz", pattern: "\\s*[,;]\\s*" },
    en: { input: "apple, pear;cherry ,  banana", pattern: "\\s*[,;]\\s*" },
  },
};

const COPY = {
  pattern: { tr: "Desen", en: "Pattern" },
  patternPlaceholder: { tr: "örn. (\\w+)@(\\w+)", en: "e.g. (\\w+)@(\\w+)" },
  replacement: { tr: "Yerine", en: "Replace with" },
  replacementPlaceholder: {
    tr: "boş = eşleşmeyi sil",
    en: "empty = delete the match",
  },
  flags: { tr: "Flag'ler", en: "Flags" },
  text: { tr: "Metin", en: "Text" },
  textPlaceholder: {
    tr: "Desenin deneneceği metin",
    en: "Text to test the pattern against",
  },
  result: { tr: "Sonuç", en: "Result" },
  parts: { tr: "Parçalar", en: "Parts" },
  noMatch: { tr: "Eşleşme yok.", en: "No match." },
  noPattern: {
    tr: "Bir desen yaz; eşleşmeler burada listelenir.",
    en: "Type a pattern; the matches are listed here.",
  },
  position: { tr: "satır:sütun", en: "line:col" },
  match: { tr: "eşleşme", en: "match" },
  copyColumn: { tr: "Sütunu kopyala", en: "Copy column" },
  copyAll: { tr: "Tüm eşleşmeleri kopyala", en: "Copy all matches" },
  column: { tr: "Kopyalanacak sütun", en: "Column to copy" },
  empty: { tr: "(boş)", en: "(empty)" },
  firstRows: {
    tr: "İlk {n} eşleşme gösteriliyor.",
    en: "Showing the first {n} matches.",
  },
};

export default function Tool({ locale }: { locale: Locale }) {
  const {
    input,
    direction,
    options,
    setInput,
    setDirection,
    setOption,
    update,
  } = useSharedState(DEFAULTS);
  const mode = (
    MODES.some((m) => m.id === direction) ? direction : "matches"
  ) as Mode;
  const { pattern, flags, replacement } = options;
  const [column, setColumn] = useState(0);

  const request: RegexRequest | null = pattern
    ? {
        input,
        pattern,
        flags,
        mode,
        replacement: mode === "replace" ? replacement : "",
      }
    : null;
  const answer = useRegex(request);
  const fresh =
    answer &&
    request &&
    JSON.stringify(answer.request) === JSON.stringify(request)
      ? answer
      : null;

  const [lastGood, setLastGood] = useState<Answer | null>(null);
  if (answer?.outcome.ok && answer !== lastGood) setLastGood(answer);

  const settled = useSettled(`${pattern}\u0000${flags}`);
  const failed = fresh && !fresh.outcome.ok ? fresh.outcome.error : null;
  const error = failed && settled ? failed : null;
  const good = fresh?.outcome.ok ? fresh : pattern ? lastGood : null;
  const outcome = good?.outcome.ok ? good.outcome : null;
  const stale = good !== null && good !== fresh;
  const sameInput = good?.request.input === input;
  const sameMode = good?.request.mode === mode;

  const toggleFlag = (flag: Flag) =>
    setOption(
      "flags",
      FLAGS.filter((f) =>
        f === flag ? !flags.includes(f) : flags.includes(f),
      ).join(""),
    );

  const loadSample = () => {
    const sample = SAMPLES[mode][locale];
    update({
      input: sample.input,
      options: {
        pattern: sample.pattern,
        flags: "g",
        replacement: sample.replacement ?? replacement,
      },
    });
  };

  const groupLabels =
    outcome?.groupNames.map((name, index) => name ?? `$${index + 1}`) ?? [];
  const copyColumn = Math.min(column, groupLabels.length);
  const matches = outcome?.matches ?? [];
  const count = outcome?.count ?? 0;

  const resultText = !outcome
    ? ""
    : mode === "replace"
      ? count > 0 && sameMode
        ? (outcome.replaced ?? "")
        : ""
      : mode === "split"
        ? sameMode
          ? (outcome.parts ?? []).join("\n")
          : ""
        : columnText(matches, copyColumn);

  const badge = outcome && input && (
    <PaneBadge>
      {count.toLocaleString(locale)}{" "}
      {locale === "tr" ? "eşleşme" : count === 1 ? "match" : "matches"}
    </PaneBadge>
  );

  return (
    <Frame
      size="split"
      toolbar={
        <Segmented
          value={mode}
          options={MODES.map((m) => ({
            id: m.id,
            label: pick(locale, m.label),
          }))}
          onChange={(id) => setDirection(id)}
          label={t(locale, "tool.options")}
        />
      }
    >
      <div className="flex shrink-0 flex-col gap-2 border-b px-3 py-2">
        <div
          className={cn(
            "flex h-10 min-w-0 items-center rounded-md border bg-background font-mono text-base transition-colors focus-within:border-foreground/30 sm:text-sm",
            error && "border-destructive focus-within:border-destructive",
          )}
        >
          <span
            aria-hidden
            className="select-none pl-2.5 text-muted-foreground"
          >
            /
          </span>
          <input
            value={pattern}
            onChange={(event) => setOption("pattern", event.target.value)}
            placeholder={pick(locale, COPY.patternPlaceholder)}
            aria-label={pick(locale, COPY.pattern)}
            aria-invalid={error ? true : undefined}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-1 text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground"
          />
          <span aria-hidden className="select-none pr-1 text-muted-foreground">
            /
          </span>
          <div
            role="group"
            aria-label={pick(locale, COPY.flags)}
            className="flex shrink-0 items-center gap-px pr-1"
          >
            {FLAGS.map((flag) => {
              const on = flags.includes(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  aria-pressed={on}
                  title={pick(locale, FLAG_HINTS[flag])}
                  aria-label={pick(locale, FLAG_HINTS[flag])}
                  onClick={() => toggleFlag(flag)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:size-6",
                    on
                      ? "bg-tint text-tint-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {flag}
                </button>
              );
            })}
          </div>
        </div>
        {mode === "replace" && (
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0">{pick(locale, COPY.replacement)}</span>
              <input
                value={replacement}
                onChange={(event) =>
                  setOption("replacement", event.target.value)
                }
                placeholder={pick(locale, COPY.replacementPlaceholder)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-foreground/30"
              />
            </label>
            <ul className="flex shrink-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {TOKENS.map((item) => (
                <li
                  key={item.token}
                  title={pick(locale, item.hint)}
                  className="rounded border bg-background px-1.5 py-px font-mono"
                >
                  {item.token}
                  <span className="sr-only"> — {pick(locale, item.hint)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error && <PaneError>{pick(locale, error)}</PaneError>}

      <Split>
        <Pane
          label={pick(locale, COPY.text)}
          actions={
            <>
              <PaneButton
                icon={Wand2}
                label={t(locale, "tool.sample")}
                labelAlways
                onClick={loadSample}
              />
              <PaneButton
                icon={Eraser}
                label={t(locale, "tool.clear")}
                showLabel={false}
                disabled={!input}
                onClick={() => setInput("")}
              />
            </>
          }
        >
          <HighlightArea
            value={input}
            onChange={setInput}
            matches={sameInput && outcome ? matches : []}
            placeholder={pick(locale, COPY.textPlaceholder)}
            label={t(locale, "tool.input")}
          />
        </Pane>
        <Pane
          label={pick(
            locale,
            mode === "matches"
              ? MODES[0].label
              : mode === "split"
                ? COPY.parts
                : COPY.result,
          )}
          badge={badge}
          className="bg-accent/60"
          actions={
            <>
              {mode === "matches" && groupLabels.length > 0 && (
                <label className="relative mr-1">
                  <span className="sr-only">{pick(locale, COPY.column)}</span>
                  <select
                    value={copyColumn}
                    onChange={(event) => setColumn(Number(event.target.value))}
                    className="h-7 max-w-32 appearance-none truncate rounded-md border bg-background pl-2 pr-6 text-xs text-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25"
                  >
                    <option value={0}>{pick(locale, COPY.match)}</option>
                    {groupLabels.map((name, index) => (
                      <option key={index} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                </label>
              )}
              <CopyAll
                locale={locale}
                text={resultText}
                disabled={!resultText}
                label={
                  mode === "matches"
                    ? pick(
                        locale,
                        copyColumn === 0 ? COPY.copyAll : COPY.copyColumn,
                      )
                    : t(locale, "tool.copy")
                }
              />
            </>
          }
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              stale && "opacity-60",
            )}
          >
            {!pattern ? (
              <Muted>{pick(locale, COPY.noPattern)}</Muted>
            ) : !outcome || !input ? null : count === 0 && mode !== "split" ? (
              <Muted>{pick(locale, COPY.noMatch)}</Muted>
            ) : mode === "matches" ? (
              <MatchTable
                locale={locale}
                matches={matches}
                groupLabels={groupLabels}
                truncated={outcome.truncated || matches.length > SHOWN_ROWS}
              />
            ) : mode === "replace" ? (
              <pre className="m-0 whitespace-pre-wrap break-words px-3 py-3 font-mono text-sm leading-relaxed text-foreground">
                {sameMode ? outcome.replaced : ""}
              </pre>
            ) : (
              <ol className="flex flex-col py-1">
                {(sameMode ? (outcome.parts ?? []) : []).map((part, index) => (
                  <li
                    key={index}
                    className="group flex items-center gap-3 px-3 py-1 hover:bg-accent"
                  >
                    <span className="w-6 shrink-0 text-right text-xs tabular text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-sm text-foreground">
                      {part || (
                        <span className="font-sans text-xs text-muted-foreground">
                          {pick(locale, COPY.empty)}
                        </span>
                      )}
                    </span>
                    <CopyButton
                      locale={locale}
                      value={part}
                      label={String(index + 1)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Pane>
      </Split>
    </Frame>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="px-3 py-3 text-sm text-muted-foreground">{children}</p>;
}

function CopyAll({
  locale,
  text,
  label,
  disabled,
}: {
  locale: Locale;
  text: string;
  label: string;
  disabled: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <PaneButton
      icon={copied ? Check : Copy}
      label={copied ? t(locale, "tool.copied") : label}
      disabled={disabled}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }
      }}
    />
  );
}

function MatchTable({
  locale,
  matches,
  groupLabels,
  truncated,
}: {
  locale: Locale;
  matches: RegexMatch[];
  groupLabels: string[];
  truncated: boolean;
}) {
  const rows = matches.slice(0, SHOWN_ROWS);
  const cell = (value: string | null) =>
    value === null ? (
      <span className="text-muted-foreground">—</span>
    ) : value === "" ? (
      <span className="font-sans text-xs text-muted-foreground">
        {pick(locale, COPY.empty)}
      </span>
    ) : (
      value
    );
  return (
    <div className="min-h-0 flex-1">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="sticky top-0 border-b bg-accent px-3 py-1.5 font-medium">
              #
            </th>
            <th className="sticky top-0 border-b bg-accent px-2 py-1.5 font-medium whitespace-nowrap">
              {pick(locale, COPY.position)}
            </th>
            <th className="sticky top-0 border-b bg-accent px-2 py-1.5 font-medium">
              {pick(locale, COPY.match)}
            </th>
            {groupLabels.map((name, index) => (
              <th
                key={index}
                className="sticky top-0 border-b bg-accent px-2 py-1.5 font-mono font-medium"
              >
                {name}
              </th>
            ))}
            <th className="sticky top-0 w-8 border-b bg-accent" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((match, index) => (
            <tr
              key={match.index}
              className="group align-baseline hover:bg-accent"
            >
              <td className="px-3 py-1 text-xs tabular text-muted-foreground">
                {index + 1}
              </td>
              <td className="px-2 py-1 text-xs tabular whitespace-nowrap text-muted-foreground">
                {match.line}:{match.column}
              </td>
              <td className="max-w-64 px-2 py-1 font-mono whitespace-pre-wrap break-all text-foreground">
                {cell(match.text)}
              </td>
              {match.groups.map((group, g) => (
                <td
                  key={g}
                  className="max-w-48 px-2 py-1 font-mono whitespace-pre-wrap break-all text-foreground"
                >
                  {cell(group)}
                </td>
              ))}
              <td className="py-0.5 pr-1 align-top">
                <CopyButton
                  locale={locale}
                  value={match.text}
                  label={`#${index + 1}`}
                  className="sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {pick(locale, COPY.firstRows).replace("{n}", String(rows.length))}
        </p>
      )}
    </div>
  );
}

function HighlightArea({
  value,
  onChange,
  matches,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  matches: RegexMatch[];
  placeholder: string;
  label: string;
}) {
  const mirror = useRef<HTMLPreElement>(null);
  const marked = useMemo(() => highlight(value, matches), [value, matches]);
  const shared =
    "m-0 px-3 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words [scrollbar-gutter:stable] [tab-size:4]";
  return (
    <div className="relative min-h-40 flex-1">
      <pre
        ref={mirror}
        aria-hidden
        className={cn(
          shared,
          "pointer-events-none absolute inset-0 overflow-hidden text-transparent",
        )}
      >
        {marked}
        <br />
      </pre>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (mirror.current) {
            mirror.current.scrollTop = event.currentTarget.scrollTop;
            mirror.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoFocus
        className={cn(
          shared,
          "absolute inset-0 size-full resize-none overflow-auto bg-transparent text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground",
        )}
      />
    </div>
  );
}

function highlight(text: string, matches: RegexMatch[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let position = 0;
  matches.slice(0, HIGHLIGHTED).forEach((match, index) => {
    if (match.index < position || match.end > text.length) return;
    if (match.index > position) nodes.push(text.slice(position, match.index));
    if (match.end === match.index) {
      nodes.push(
        <span key={`z${index}`} className="relative">
          <span className="absolute -left-px top-0 h-[1.4em] w-0.5 rounded-full bg-tint/70" />
        </span>,
      );
      position = match.index;
      return;
    }
    const inner: ReactNode[] = [];
    let cursor = match.index;
    const ranges = match.ranges
      .filter(
        (range): range is [number, number] =>
          range !== null && range[1] > range[0],
      )
      .sort((a, b) => a[0] - b[0]);
    for (const [start, end] of ranges) {
      if (start < cursor || end > match.end) continue;
      if (start > cursor) inner.push(text.slice(cursor, start));
      inner.push(
        <span key={start} className="rounded-sm bg-tint/35">
          {text.slice(start, end)}
        </span>,
      );
      cursor = end;
    }
    if (cursor < match.end) inner.push(text.slice(cursor, match.end));
    nodes.push(
      <mark
        key={index}
        className={cn(
          "rounded-sm text-transparent",
          index % 2 === 0
            ? "bg-tint/20"
            : "bg-tint/10 outline outline-1 -outline-offset-1 outline-tint/30",
        )}
      >
        {inner}
      </mark>,
    );
    position = match.end;
  });
  nodes.push(text.slice(position));
  return nodes;
}
