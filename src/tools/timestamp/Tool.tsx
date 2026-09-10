"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ChevronDown, Clock, Eraser, Wand2 } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import {
  Frame,
  KeyValueList,
  PaneBadge,
  PaneButton,
  PaneError,
} from "@/components/Panel";
import type { ToolError } from "@/tools/text-tool";
import { cn } from "@/lib/utils";
import { useSharedState } from "../timezone/shared-state";
import { CopyButton, LineField, useLastGood, useSettled } from "../timezone/ui";
import ZoneInput, { useBrowserZone } from "../timezone/ZoneInput";
import { resolveZone } from "../timezone/zones";
import {
  describe,
  describeDate,
  now as nowSeconds,
  UNIT_LABELS,
  type Description,
  type UnitChoice,
} from "./logic";

const SAMPLE = "1700000000";

const DEFAULTS = {
  input: "",
  direction: "describe",
  options: { timeZone: null as string | null, unit: "auto" },
};

const UNITS: UnitChoice[] = ["auto", "s", "ms", "us", "ns"];
const UNIT_SHORT: Record<UnitChoice, Record<Locale, string>> = {
  auto: { tr: "Otomatik", en: "Auto" },
  s: { tr: "s", en: "s" },
  ms: { tr: "ms", en: "ms" },
  us: { tr: "µs", en: "µs" },
  ns: { tr: "ns", en: "ns" },
};

const COPY = {
  zone: { tr: "Saat dilimi", en: "Time zone" },
  unit: { tr: "Birim", en: "Unit" },
  now: { tr: "Şimdi", en: "Now" },
  current: { tr: "şu an", en: "now" },
  result: { tr: "Sonuç", en: "Result" },
  copyAll: { tr: "Tümünü kopyala", en: "Copy all" },
  detected: { tr: "algılanan", en: "detected" },
  placeholder: {
    tr: "1700000000, 2023-11-15 01:13 ya da 15.11.2023 01:13",
    en: "1700000000, 2023-11-15 01:13 or 15.11.2023 01:13",
  },
};

function subscribeSecond(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

const currentSecond = () => Math.floor(Date.now() / 1000);

export default function Tool({ locale }: { locale: Locale }) {
  const browser = useBrowserZone();
  const second = useSyncExternalStore(subscribeSecond, currentSecond, () => 0);
  const { input, options, setInput, setOption } = useSharedState(DEFAULTS);
  const zoneInput = options.timeZone ?? browser;
  const unit = (
    UNITS.includes(options.unit as UnitChoice) ? options.unit : "auto"
  ) as UnitChoice;
  const empty = !input.trim();

  const computed = useMemo((): {
    result: Description | null;
    error: ToolError | null;
  } => {
    if (empty) return { result: null, error: null };
    try {
      const now = second ? new Date(second * 1000) : new Date();
      return {
        result: describe(input, locale, zoneInput, unit, now),
        error: null,
      };
    } catch (error) {
      return { result: null, error: error as ToolError };
    }
  }, [empty, input, locale, zoneInput, unit, second]);

  const current = useMemo(() => {
    if (!empty || second === 0) return null;
    const date = new Date(second * 1000);
    return describeDate(
      { date, unit: null, zoned: false },
      locale,
      resolveZone(zoneInput),
      null,
      date,
    );
  }, [empty, second, locale, zoneInput]);

  const settled = useSettled(input);
  const last = useLastGood(computed.result, empty);
  const shown = current ?? last;
  const error = computed.error && settled ? computed.error : null;
  const zoneError =
    shown?.zoneError ?? (error?.field === "timeZone" ? error : null);
  const inputError = error && error.field !== "timeZone" ? error : null;
  const dim = !empty && computed.result === null && shown !== null;

  const badge =
    !empty && shown?.unit
      ? unit === "auto"
        ? `${pick(locale, COPY.detected)}: ${UNIT_SHORT[shown.unit][locale]}`
        : pick(locale, UNIT_LABELS[shown.unit])
      : null;
  const note =
    !empty && shown?.zoned && shown.zone
      ? locale === "tr"
        ? `Girdi ${shown.zone} saatiyle okundu.`
        : `Read as ${shown.zone} time.`
      : null;

  return (
    <Frame size="content">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <LineField
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={pick(locale, COPY.placeholder)}
          aria-label={t(locale, "tool.input")}
          aria-invalid={inputError ? true : undefined}
          autoFocus
        />
        <PaneButton
          icon={Clock}
          label={pick(locale, COPY.now)}
          labelAlways
          className="h-9 sm:h-7"
          onClick={() => setInput(nowSeconds())}
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
          invalid={zoneError !== null}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0">{pick(locale, COPY.unit)}</span>
          <span className="relative">
            <select
              value={unit}
              onChange={(event) => setOption("unit", event.target.value)}
              className="h-8 appearance-none rounded-md border bg-background pl-2.5 pr-7 text-sm text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25"
            >
              {UNITS.map((value) => (
                <option key={value} value={value}>
                  {value === "auto"
                    ? UNIT_SHORT.auto[locale]
                    : `${UNIT_SHORT[value][locale]} (${pick(locale, UNIT_LABELS[value])})`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </span>
        </label>
      </div>

      <section
        aria-label={t(locale, "tool.output")}
        className="flex min-h-0 flex-col bg-accent/60"
      >
        {inputError && (
          <PaneError>{pick(locale, inputError.localized)}</PaneError>
        )}
        {zoneError && (
          <PaneError>{pick(locale, zoneError.localized)}</PaneError>
        )}
        {shown && (
          <>
            <header className="flex shrink-0 items-center gap-2 border-b pl-3 pr-1.5 h-10">
              <h2 className="text-xs font-medium text-muted-foreground">
                {pick(locale, empty ? COPY.current : COPY.result)}
              </h2>
              {badge && <PaneBadge>{badge}</PaneBadge>}
              {note && (
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  {note}
                </span>
              )}
              <CopyButton
                locale={locale}
                value={shown.text}
                label={pick(locale, COPY.copyAll)}
                className="ml-auto"
              />
            </header>
            <div className={cn("min-h-0 overflow-auto", dim && "opacity-60")}>
              <KeyValueList locale={locale} rows={shown.rows} />
            </div>
          </>
        )}
      </section>
    </Frame>
  );
}
