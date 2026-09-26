"use client";

import { useMemo, useState } from "react";
import { Clock, Eraser, Plus, Wand2, X } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Frame, KeyValueList, PaneButton, PaneError } from "@/components/Panel";
import { ToolError } from "@/tools/text-tool";
import { cn } from "@/lib/utils";
import { convertZones, nowIn, type Conversion } from "./logic";
import { useSharedState } from "./shared-state";
import { CopyButton, LineField, useLastGood, useSettled } from "./ui";
import ZoneInput, { useBrowserZone } from "./ZoneInput";
import { pickZone, resolveZone } from "./zones";

const SAMPLE = "2026-09-25 09:00";

const DEFAULTS = {
  input: "",
  direction: "convert",
  options: { source: null as string | null, extra: "" },
};

const COPY = {
  source: { tr: "Girdinin dilimi", en: "Input's zone" },
  extra: { tr: "Ek dilimler", en: "Extra zones" },
  add: { tr: "Dilim ekle", en: "Add a zone" },
  addPlaceholder: { tr: "şehir ya da dilim", en: "city or zone" },
  remove: { tr: "Kaldır", en: "Remove" },
  now: { tr: "Şimdi", en: "Now" },
  placeholder: {
    tr: "2026-09-25 09:00, 25.09.2026 14:30, 14:30 ya da timestamp",
    en: "2026-09-25 09:00, 25.09.2026 14:30, 14:30 or a timestamp",
  },
  unknown: { tr: "bilinmeyen saat dilimi", en: "unknown time zone" },
  zones: { tr: "Dilimler", en: "Zones" },
  copyAll: { tr: "Tümünü kopyala", en: "Copy all" },
  day: { tr: "gün", en: "day" },
  days: { tr: "gün", en: "days" },
  empty: {
    tr: "Bir tarih ya da saat yaz; seçtiğin dilimde okunur, her dilimdeki karşılığı burada listelenir.",
    en: "Type a date or a time; it is read in the zone you pick, and its time in every zone is listed here.",
  },
};

export default function Tool({ locale }: { locale: Locale }) {
  const browser = useBrowserZone();
  const { input, options, setInput, setOption } = useSharedState(DEFAULTS);
  const [adding, setAdding] = useState("");
  const [rejected, setRejected] = useState(false);
  const source = options.source ?? browser;
  const extras = useMemo(
    () => options.extra.split(/[,\s]+/).filter(Boolean),
    [options.extra],
  );

  const computed = useMemo((): {
    result: Conversion | null;
    error: ToolError | null;
  } => {
    try {
      return {
        result: convertZones(input, source, extras, locale),
        error: null,
      };
    } catch (error) {
      return { result: null, error: error as ToolError };
    }
  }, [input, source, extras, locale]);

  const settled = useSettled(`${input}\u0000${source}`);
  const empty = !input.trim();
  const shown = useLastGood(computed.result, empty);
  const error = computed.error && settled ? computed.error : null;
  const dim = computed.result === null && shown !== null;

  const addZone = (value: string) => {
    const zone = pickZone(value);
    if (!zone) {
      setRejected(value.trim() !== "");
      return;
    }
    if (!extras.includes(zone)) setOption("extra", [...extras, zone].join(","));
    setAdding("");
    setRejected(false);
  };

  return (
    <Frame size="content">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <LineField
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={pick(locale, COPY.placeholder)}
          aria-label={t(locale, "tool.input")}
          aria-invalid={(error && error.field !== "source") || undefined}
          autoFocus
        />
        <PaneButton
          icon={Clock}
          label={pick(locale, COPY.now)}
          labelAlways
          className="h-9 sm:h-7"
          onClick={() => setInput(nowIn(resolveZone(source) ?? "UTC"))}
        />
        <PaneButton
          icon={Wand2}
          label={t(locale, "tool.sample")}
          showLabel
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
          label={pick(locale, COPY.source)}
          value={source}
          onChange={(value) => setOption("source", value)}
          invalid={error?.field === "source"}
        />
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <span className="mr-0.5 shrink-0">{pick(locale, COPY.extra)}</span>
          {extras.map((zone) => (
            <span
              key={zone}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md border bg-background pl-2 pr-0.5 font-mono text-xs",
                resolveZone(zone) ? "text-foreground" : "text-destructive",
              )}
            >
              {zone}
              <button
                type="button"
                title={`${pick(locale, COPY.remove)}: ${zone}`}
                aria-label={`${pick(locale, COPY.remove)}: ${zone}`}
                onClick={() =>
                  setOption(
                    "extra",
                    extras.filter((other) => other !== zone).join(","),
                  )
                }
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <ZoneInput
              label={pick(locale, COPY.add)}
              value={adding}
              onChange={(value) => {
                setAdding(value);
                setRejected(false);
              }}
              onEnter={addZone}
              invalid={rejected}
              placeholder={pick(locale, COPY.addPlaceholder)}
              className="[&>span]:sr-only [&_input]:w-40 sm:[&_input]:w-44"
            />
            <PaneButton
              icon={Plus}
              label={pick(locale, COPY.add)}
              showLabel={false}
              disabled={!adding.trim()}
              onClick={() => addZone(adding)}
            />
          </span>
        </div>
      </div>

      <section
        aria-label={t(locale, "tool.output")}
        className="flex min-h-0 flex-col bg-accent/60"
      >
        {error && <PaneError>{pick(locale, error.localized)}</PaneError>}
        {shown ? (
          <div
            className={cn(
              "flex min-h-0 flex-col overflow-auto",
              dim && "opacity-60",
            )}
          >
            <div className="flex items-start">
              <KeyValueList
                locale={locale}
                className="min-w-0 flex-1"
                rows={[
                  { label: "ISO 8601 (UTC)", value: shown.isoUtc },
                  {
                    label: `ISO 8601 (${shown.source})`,
                    value: shown.isoSource,
                  },
                  { label: "Unix (s)", value: shown.unix },
                ]}
              />
              <div className="p-1.5">
                <CopyButton
                  locale={locale}
                  value={shown.text}
                  label={pick(locale, COPY.copyAll)}
                />
              </div>
            </div>
            <ZoneTable locale={locale} result={shown} />
          </div>
        ) : (
          !error && (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              {pick(locale, COPY.empty)}
            </p>
          )
        )}
      </section>
    </Frame>
  );
}

function ZoneTable({ locale, result }: { locale: Locale; result: Conversion }) {
  const dayLabel = (delta: number) =>
    `${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${pick(locale, Math.abs(delta) === 1 ? COPY.day : COPY.days)}`;
  return (
    <ul
      aria-label={pick(locale, COPY.zones)}
      className="grid border-t py-1 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto]"
    >
      {result.rows.map((row) => (
        <li
          key={row.zone}
          className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-1.5 hover:bg-accent sm:col-span-6 sm:grid-cols-subgrid"
        >
          <span
            className={cn(
              "truncate text-sm",
              row.source
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
              !row.valid && "text-destructive",
            )}
            title={row.zone}
          >
            {row.zone}
          </span>
          {row.valid ? (
            <div className="col-start-1 flex flex-wrap items-baseline gap-x-2 sm:contents">
              <span
                className={cn(
                  "font-mono text-lg tabular text-foreground sm:text-right",
                  row.source && "font-semibold",
                )}
              >
                {row.time}
              </span>
              <span className="text-sm text-muted-foreground">{row.date}</span>
              <span>
                {row.dayDelta ? (
                  <span className="rounded-md border px-1.5 py-px font-mono text-[0.6875rem] tabular text-muted-foreground">
                    {dayLabel(row.dayDelta)}
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-xs tabular text-muted-foreground">
                {row.offset}
              </span>
            </div>
          ) : (
            <span className="col-start-1 text-sm text-destructive sm:col-span-4 sm:col-start-auto">
              {pick(locale, COPY.unknown)}
            </span>
          )}
          <CopyButton
            locale={locale}
            value={row.iso ?? ""}
            label={row.zone}
            className="col-start-2 row-span-2 row-start-1 opacity-100 sm:col-start-6 sm:row-span-1 sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          />
        </li>
      ))}
    </ul>
  );
}
