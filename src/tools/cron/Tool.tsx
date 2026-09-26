"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Eraser, Info, TriangleAlert, Wand2 } from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Frame, PaneButton, PaneError } from "@/components/Panel";
import { ToolError } from "@/tools/text-tool";
import { cn } from "@/lib/utils";
import { useSharedState } from "../timezone/shared-state";
import { CopyButton, LineField, useSettled } from "../timezone/ui";
import ZoneInput, { useBrowserZone } from "../timezone/ZoneInput";
import {
  CronFieldError,
  explainCron,
  PRESETS,
  splitCron,
  type Explanation,
  type SyntaxChoice,
} from "./logic";

const SAMPLE = "0 9 * * 1-5";

const DEFAULTS = {
  input: "",
  direction: "explain",
  options: { timeZone: null as string | null, count: "5", syntax: "auto" },
};

const SYNTAXES: { value: SyntaxChoice; label: Localized }[] = [
  { value: "auto", label: { tr: "Otomatik", en: "Auto" } },
  { value: "unix", label: { tr: "Unix", en: "Unix" } },
  { value: "seconds", label: { tr: "Unix + saniye", en: "Unix + seconds" } },
  { value: "quartz", label: { tr: "Quartz / Spring", en: "Quartz / Spring" } },
];

const COUNTS = ["3", "5", "10", "20"];

const COPY = {
  zone: { tr: "Saat dilimi", en: "Time zone" },
  syntax: { tr: "Sözdizimi", en: "Syntax" },
  count: { tr: "Sonraki çalışma sayısı", en: "Next runs to show" },
  runs: { tr: "Sonraki çalışmalar", en: "Next runs" },
  copyAll: { tr: "Tümünü kopyala", en: "Copy all" },
  fields: { tr: "Alanlar", en: "Fields" },
  presets: { tr: "Hazır ifadeler", en: "Presets" },
  guide: { tr: "Sözdizimi", en: "Syntax" },
  placeholder: { tr: "0 9 * * 1-5 ya da @daily", en: "0 9 * * 1-5 or @daily" },
};

const GUIDE: { field: Localized; range: string }[] = [
  { field: { tr: "dakika", en: "minute" }, range: "0–59" },
  { field: { tr: "saat", en: "hour" }, range: "0–23" },
  { field: { tr: "ayın günü", en: "day of month" }, range: "1–31" },
  { field: { tr: "ay", en: "month" }, range: "1–12, JAN–DEC" },
  { field: { tr: "haftanın günü", en: "day of week" }, range: "0–7, SUN–SAT" },
];

const SYMBOLS: { symbol: string; meaning: Localized }[] = [
  { symbol: "*", meaning: { tr: "her değer", en: "every value" } },
  { symbol: ",", meaning: { tr: "liste: 1,15", en: "list: 1,15" } },
  { symbol: "-", meaning: { tr: "aralık: 1-5", en: "range: 1-5" } },
  { symbol: "/", meaning: { tr: "adım: */15", en: "step: */15" } },
];

type Outcome = {
  key: string;
  result: Explanation | null;
  error: ToolError | null;
};

function Select({
  label,
  value,
  onChange,
  choices,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  choices: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="shrink-0">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 appearance-none rounded-md border bg-background pl-2.5 pr-7 text-sm text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25"
        >
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      </span>
    </label>
  );
}

export default function Tool({ locale }: { locale: Locale }) {
  const browser = useBrowserZone();
  const { input, options, setInput, setOption } = useSharedState(DEFAULTS);
  const zoneInput = options.timeZone ?? browser;
  const syntax = (
    SYNTAXES.some((s) => s.value === options.syntax) ? options.syntax : "auto"
  ) as SyntaxChoice;
  const count = COUNTS.includes(options.count) ? Number(options.count) : 5;
  const empty = !input.trim();
  const key = `${input}\u0000${zoneInput}\u0000${syntax}\u0000${count}\u0000${locale}`;

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  useEffect(() => {
    if (empty) return;
    let live = true;
    explainCron(input, locale, zoneInput, count, syntax)
      .then((result) => {
        if (live) setOutcome({ key, result, error: null });
      })
      .catch((error: unknown) => {
        if (live) {
          setOutcome({
            key,
            result: null,
            error:
              error instanceof ToolError
                ? error
                : new ToolError({
                    tr: "Cron ifadesi okunamadı.",
                    en: "Could not read the cron expression.",
                  }),
          });
        }
      });
    return () => {
      live = false;
    };
  }, [key, empty, input, locale, zoneInput, count, syntax]);

  const [last, setLast] = useState<Explanation | null>(null);
  const fresh = outcome?.key === key ? outcome : null;
  if (fresh?.result && fresh.result !== last) setLast(fresh.result);
  if (empty && last) setLast(null);

  const settled = useSettled(input);
  const error = !empty && fresh?.error && settled ? fresh.error : null;
  const shown = empty ? null : (fresh?.result ?? last);
  const dim = shown !== null && fresh?.result !== shown;

  const cells = useMemo(() => {
    try {
      return splitCron(input, syntax)?.fields ?? null;
    } catch {
      return null;
    }
  }, [input, syntax]);
  const badIndex = error instanceof CronFieldError ? error.index : -1;
  const runsError = shown?.runsError ?? null;

  return (
    <Frame size="content">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <LineField
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={pick(locale, COPY.placeholder)}
          aria-label={t(locale, "tool.input")}
          aria-invalid={error ? true : undefined}
          autoFocus
        />
        <PaneButton
          icon={Wand2}
          label={t(locale, "tool.sample")}
          className="h-9 sm:h-7"
          disabled={input === SAMPLE}
          onClick={() => setInput(SAMPLE)}
        />
        <PaneButton
          icon={Eraser}
          label={t(locale, "tool.clear")}
          showLabel={false}
          disabled={!input}
          onClick={() => setInput("")}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-b bg-muted/40 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
        <ZoneInput
          label={pick(locale, COPY.zone)}
          value={zoneInput}
          onChange={(value) => setOption("timeZone", value)}
          invalid={runsError?.field === "timeZone"}
        />
        <Select
          label={pick(locale, COPY.syntax)}
          value={syntax}
          onChange={(value) => setOption("syntax", value)}
          choices={SYNTAXES.map((s) => ({
            value: s.value,
            label: pick(locale, s.label),
          }))}
        />
        <Select
          label={pick(locale, COPY.count)}
          value={String(count)}
          onChange={(value) => setOption("count", value)}
          choices={COUNTS.map((value) => ({ value, label: value }))}
        />
      </div>

      <section
        aria-label={t(locale, "tool.output")}
        className="flex min-h-0 flex-col overflow-auto bg-accent/60"
      >
        {error && <PaneError>{pick(locale, error.localized)}</PaneError>}
        {!empty && cells && (
          <ol
            aria-label={pick(locale, COPY.fields)}
            className="flex shrink-0 flex-wrap gap-1.5 px-3 pt-3"
          >
            {cells.map((cell, index) => (
              <li
                key={index}
                className={cn(
                  "flex min-w-14 flex-col items-center rounded-md border bg-background px-2 py-1",
                  index === badIndex &&
                    "border-destructive/60 text-destructive",
                )}
              >
                <span className="font-mono text-sm">{cell.value}</span>
                <span
                  className={cn(
                    "text-[0.6875rem]",
                    index === badIndex
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {pick(locale, cell.name)}
                </span>
              </li>
            ))}
          </ol>
        )}

        {shown && (
          <div className={cn("flex flex-col", dim && "opacity-60")}>
            <div className="flex items-start gap-2 px-3 pt-3">
              <p className="min-w-0 flex-1 text-lg font-medium leading-snug text-foreground">
                {shown.sentence}
              </p>
              <CopyButton
                locale={locale}
                value={shown.text}
                label={pick(locale, COPY.copyAll)}
              />
            </div>
            {shown.warnings.length > 0 && (
              <ul className="flex flex-col gap-1 px-3 pt-2">
                {shown.warnings.map((warning, index) => {
                  const or = warning.kind === "or";
                  const Icon = or ? TriangleAlert : Info;
                  return (
                    <li
                      key={index}
                      className={cn(
                        "flex items-start gap-1.5 text-xs",
                        or ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="mt-px size-3.5 shrink-0" />
                      {pick(locale, warning.message)}
                    </li>
                  );
                })}
              </ul>
            )}
            <h3 className="mt-3 border-t px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground">
              {pick(locale, COPY.runs)}
              {shown.zone && ` · ${shown.zone}`}
            </h3>
            {runsError ? (
              <PaneError className="border-t">
                {pick(locale, runsError.localized)}
              </PaneError>
            ) : (
              <ul className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] pb-2 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]">
                {shown.runs.map((run) => (
                  <li
                    key={run.iso}
                    className="group col-span-4 grid grid-cols-subgrid items-baseline gap-x-3 px-3 py-1 hover:bg-accent sm:col-span-5"
                  >
                    <span className="text-sm tabular text-foreground">
                      {run.date}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {run.weekday}
                    </span>
                    <span className="text-right font-mono text-sm tabular text-foreground">
                      {run.time}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:block">
                      {run.relative}
                    </span>
                    <CopyButton
                      locale={locale}
                      value={run.iso}
                      label={run.iso}
                      className="self-center sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {empty && <EmptyState locale={locale} onPick={setInput} />}
      </section>
    </Frame>
  );
}

function EmptyState({
  locale,
  onPick,
}: {
  locale: Locale;
  onPick: (expression: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          {pick(locale, COPY.presets)}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.expression}
              type="button"
              onClick={() => onPick(preset.expression)}
              title={preset.expression}
              className="inline-flex h-7 items-center gap-2 rounded-md border bg-background px-2 text-xs text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <span className="font-mono">{preset.expression}</span>
              {preset.label.en !== preset.expression && (
                <span className="text-muted-foreground">
                  {pick(locale, preset.label)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          {pick(locale, COPY.guide)}
        </h3>
        <ol className="flex flex-wrap gap-1.5">
          {GUIDE.map((field, index) => (
            <li
              key={index}
              className="flex min-w-24 flex-col rounded-md border bg-background px-2 py-1"
            >
              <span className="text-xs text-foreground">
                {index + 1}. {pick(locale, field.field)}
              </span>
              <span className="font-mono text-[0.6875rem] text-muted-foreground">
                {field.range}
              </span>
            </li>
          ))}
        </ol>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          {SYMBOLS.map((item) => (
            <div key={item.symbol} className="contents">
              <dt className="font-mono text-foreground">{item.symbol}</dt>
              <dd className="text-muted-foreground">
                {pick(locale, item.meaning)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
