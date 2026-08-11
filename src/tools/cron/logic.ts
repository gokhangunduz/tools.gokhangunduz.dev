import type { Locale, Localized } from "@/i18n";
import { ToolError } from "../text-tool";
import { relative } from "../timestamp/logic";
import { requireZone, wallClockIn, isoInZone } from "../timezone/zones";

/**
 * A cron expression in words, and the next times it will actually fire.
 *
 * The sentence alone is not enough: "0 0 31 2 *" reads fine and never runs,
 * and a five-field expression with a day-of-month *and* a day-of-week is an
 * OR, not an AND, which is the single most common way a schedule surprises
 * someone. Printing the next runs is what makes those visible.
 */
export type Syntax = "unix" | "seconds" | "quartz";
export type SyntaxChoice = Syntax | "auto";

type FieldKind =
  "second" | "minute" | "hour" | "dom" | "month" | "dow" | "year";

type FieldSpec = { kind: FieldKind; name: Localized; min: number; max: number };

const SPEC: Record<FieldKind, FieldSpec> = {
  second: {
    kind: "second",
    name: { tr: "saniye", en: "second" },
    min: 0,
    max: 59,
  },
  minute: {
    kind: "minute",
    name: { tr: "dakika", en: "minute" },
    min: 0,
    max: 59,
  },
  hour: { kind: "hour", name: { tr: "saat", en: "hour" }, min: 0, max: 23 },
  dom: {
    kind: "dom",
    name: { tr: "ayın günü", en: "day of month" },
    min: 1,
    max: 31,
  },
  month: { kind: "month", name: { tr: "ay", en: "month" }, min: 1, max: 12 },
  dow: {
    kind: "dow",
    name: { tr: "haftanın günü", en: "day of week" },
    min: 0,
    max: 7,
  },
  year: { kind: "year", name: { tr: "yıl", en: "year" }, min: 1970, max: 2099 },
};

const LAYOUT: Record<Syntax, FieldKind[]> = {
  unix: ["minute", "hour", "dom", "month", "dow"],
  seconds: ["second", "minute", "hour", "dom", "month", "dow"],
  quartz: ["second", "minute", "hour", "dom", "month", "dow", "year"],
};

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export const PRESETS: { expression: string; label: Localized }[] = [
  {
    expression: "*/5 * * * *",
    label: { tr: "5 dakikada bir", en: "Every 5 minutes" },
  },
  { expression: "0 * * * *", label: { tr: "Saat başı", en: "Every hour" } },
  { expression: "0 0 * * *", label: { tr: "Gece yarısı", en: "Midnight" } },
  { expression: "0 3 * * 0", label: { tr: "Pazar 03:00", en: "Sunday 03:00" } },
  {
    expression: "0 9 * * 1-5",
    label: { tr: "Hafta içi 09:00", en: "Weekdays 09:00" },
  },
  {
    expression: "0 0 1 * *",
    label: { tr: "Ayın ilk günü", en: "First of the month" },
  },
  { expression: "@daily", label: { tr: "@daily", en: "@daily" } },
  { expression: "@hourly", label: { tr: "@hourly", en: "@hourly" } },
];

export type CronField = { name: Localized; value: string };

/** A validation error that points at one field of the expression. */
export class CronFieldError extends ToolError {
  readonly index: number;
  constructor(localized: Localized, index: number) {
    super(localized);
    this.index = index;
  }
}

export type Split = {
  syntax: Syntax;
  /** Auto-detection chose Quartz, whose day-of-week numbering starts at 1 = Sunday. */
  quartzDetected: boolean;
  tokens: string[];
  fields: CronField[];
  expression: string;
};

/** The fields of an expression under the chosen or detected syntax. */
export function splitCron(
  input: string,
  choice: SyntaxChoice = "auto",
): Split | null {
  const raw = input.trim();
  if (!raw) return null;
  const macro = MACROS[raw.toLowerCase()];
  if (raw.startsWith("@") && !macro) {
    throw new ToolError({
      tr: `"${raw}" tanınmadı. @yearly, @monthly, @weekly, @daily ya da @hourly kullanılabilir.`,
      en: `"${raw}" is not recognised. Use @yearly, @monthly, @weekly, @daily or @hourly.`,
    });
  }
  const expression = macro ?? raw;
  const tokens = expression.split(/\s+/);
  const count = tokens.length;

  let syntax: Syntax;
  let quartzDetected = false;
  if (macro) syntax = "unix";
  else if (choice !== "auto") syntax = choice;
  else if (
    count === 7 ||
    (count === 6 && /[?LW#]/i.test(tokens.slice(3).join(" ")))
  ) {
    syntax = "quartz";
    quartzDetected = true;
  } else syntax = count === 6 ? "seconds" : "unix";

  if (count < 5) {
    throw new ToolError({
      tr: `En az 5 alan gerekir (dakika saat ayın-günü ay haftanın-günü); ${count} verildi.`,
      en: `At least 5 fields are needed (minute hour day-of-month month day-of-week); got ${count}.`,
    });
  }
  if (count > 7) {
    throw new ToolError({
      tr: `En fazla 7 alan olabilir; ${count} verildi.`,
      en: `There can be at most 7 fields; got ${count}.`,
    });
  }
  const layout = LAYOUT[syntax];
  const expected = syntax === "quartz" ? [6, 7] : [layout.length];
  if (!expected.includes(count)) {
    const names: Record<Syntax, Localized> = {
      unix: { tr: "Unix sözdizimi 5 alan", en: "Unix syntax takes 5 fields" },
      seconds: {
        tr: "Unix + saniye sözdizimi 6 alan",
        en: "Unix + seconds syntax takes 6 fields",
      },
      quartz: {
        tr: "Quartz sözdizimi 6 ya da 7 alan",
        en: "Quartz syntax takes 6 or 7 fields",
      },
    };
    throw new ToolError({
      tr: `${names[syntax].tr} ister; ${count} verildi.`,
      en: `${names[syntax].en}; got ${count}.`,
    });
  }

  return {
    syntax,
    quartzDetected,
    tokens,
    expression,
    fields: tokens.map((value, index) => ({
      name: SPEC[layout[index]].name,
      value,
    })),
  };
}

function valueOf(text: string, spec: FieldSpec): number | null {
  if (/^\d+$/.test(text)) return Number(text);
  const lower = text.toLowerCase();
  if (spec.kind === "month" && MONTHS.includes(lower))
    return MONTHS.indexOf(lower) + 1;
  if (spec.kind === "dow" && DAYS.includes(lower)) return DAYS.indexOf(lower);
  return null;
}

function validateField(
  token: string,
  index: number,
  spec: FieldSpec,
  syntax: Syntax,
) {
  const n = index + 1;
  const min = spec.kind === "dow" && syntax === "quartz" ? 1 : spec.min;
  const max = spec.kind === "dow" && syntax === "quartz" ? 7 : spec.max;
  const unclear = (part: string) =>
    new CronFieldError(
      {
        tr: `${n}. alan (${spec.name.tr}) anlaşılmadı: "${part}".`,
        en: `Field ${n} (${spec.name.en}) is not understood: "${part}".`,
      },
      index,
    );
  const range = (value: number) =>
    new CronFieldError(
      {
        tr: `${n}. alan (${spec.name.tr}) ${min}–${max} arasında olmalı, ${value} verildi.`,
        en: `Field ${n} (${spec.name.en}) must be between ${min} and ${max}; got ${value}.`,
      },
      index,
    );
  const check = (text: string, part: string) => {
    const value = valueOf(text, spec);
    if (value === null) throw unclear(part);
    if (value < min || value > max) throw range(value);
    return value;
  };

  for (const part of token.split(",")) {
    if (!part) throw unclear(token);
    if (part === "?" && (spec.kind === "dom" || spec.kind === "dow")) continue;
    if (spec.kind === "dom" && /^(L(-\d+)?|LW|\d+W)$/i.test(part)) {
      const day = /^(\d+)W$/i.exec(part)?.[1];
      if (day) check(day, part);
      continue;
    }
    if (spec.kind === "dow") {
      const special = /^(\w+)(#([1-5])|L)$/i.exec(part);
      if (special) {
        check(special[1], part);
        continue;
      }
      if (/^L$/i.test(part)) continue;
    }
    const [base, step, extra] = part.split("/");
    if (extra !== undefined) throw unclear(part);
    if (step !== undefined && !/^[1-9]\d*$/.test(step)) throw unclear(part);
    if (base === "*") continue;
    const bounds = base.split("-");
    if (bounds.length > 2) throw unclear(part);
    const [from, to] = bounds.map((bound) => check(bound, part));
    if (to !== undefined && to < from && spec.kind !== "dow") {
      throw new CronFieldError(
        {
          tr: `${n}. alan (${spec.name.tr}) aralığı ters: ${base}.`,
          en: `Field ${n} (${spec.name.en}) has a reversed range: ${base}.`,
        },
        index,
      );
    }
  }
}

/** Every field checked against its range, so the message can name the field. */
export function validateCron(split: Split) {
  const layout = LAYOUT[split.syntax];
  split.tokens.forEach((token, index) =>
    validateField(token, index, SPEC[layout[index]], split.syntax),
  );
}

function quartzDow(token: string): string {
  return token.replace(/\d+/g, (digits, offset: number, whole: string) =>
    whole[offset - 1] === "#" ? digits : String(Number(digits) - 1),
  );
}

function yearFilter(
  token: string | undefined,
): ((year: number) => boolean) | null {
  if (!token || token === "*" || token === "?") return null;
  const parts = token.split(",").map((part) => {
    const [base, step] = part.split("/");
    const [from, to] =
      base === "*" ? [1970, 2099] : base.split("-").map(Number);
    return { from, to: to ?? (step ? 2099 : from), step: Number(step ?? 1) };
  });
  return (year) =>
    parts.some(
      ({ from, to, step }) =>
        year >= from && year <= to && (year - from) % step === 0,
    );
}

export type CronRun = {
  iso: string;
  date: string;
  weekday: string;
  time: string;
  relative: string;
};

export type Warning = { kind: "quartz" | "or"; message: Localized };

export type Explanation = {
  split: Split;
  sentence: string;
  warnings: Warning[];
  runs: CronRun[];
  /** The runs could not be listed; the sentence and fields still stand. */
  runsError: ToolError | null;
  zone: string | null;
  text: string;
};

function never(): ToolError {
  return new ToolError({
    tr: "Bu ifade hiçbir tarihte çalışmaz (örn. 31 Şubat ya da 30 Şubat).",
    en: "This expression never fires (e.g. 31 or 30 February).",
  });
}

export async function explainCron(
  input: string,
  locale: Locale,
  zoneInput: string,
  count: number,
  choice: SyntaxChoice = "auto",
  now = new Date(),
): Promise<Explanation | null> {
  const split = splitCron(input, choice);
  if (!split) return null;
  validateCron(split);

  const [cronstrue, { CronExpressionParser }] = await Promise.all([
    import("cronstrue/i18n"),
    import("cron-parser"),
  ]);

  const quartz = split.syntax === "quartz";
  let sentence: string;
  try {
    sentence = cronstrue.default.toString(split.expression, {
      locale,
      throwExceptionOnParseError: true,
      verbose: false,
      use24HourTimeFormat: true,
      dayOfWeekStartIndexZero: !quartz,
    });
  } catch {
    throw new ToolError({
      tr: "Cron ifadesi okunamadı. Alanları ve özel karakterleri (* , - / ? L W #) kontrol et.",
      en: "Could not read the cron expression. Check the fields and special characters (* , - / ? L W #).",
    });
  }

  const warnings: Warning[] = [];
  if (split.quartzDetected) {
    warnings.push({
      kind: "quartz",
      message: {
        tr: "Quartz sözdizimi algılandı; haftanın günü 1=Pazar, 7=Cumartesi.",
        en: "Quartz syntax detected; day of week is 1=Sunday … 7=Saturday.",
      },
    });
  }
  const layout = LAYOUT[split.syntax];
  const dom = split.tokens[layout.indexOf("dom")];
  const dow = split.tokens[layout.indexOf("dow")];
  const restricted = (token: string) => token !== "*" && token !== "?";
  if (restricted(dom) && restricted(dow)) {
    warnings.push({
      kind: "or",
      message: {
        tr: `Ayın günü (${dom}) ve haftanın günü (${dow}) birlikte verilmiş: cron bunları VEYA ile birleştirir, ikisinden biri tutunca çalışır.`,
        en: `Both day of month (${dom}) and day of week (${dow}) are set: cron combines them with OR, so either one matching fires it.`,
      },
    });
  }

  let zone: string | null = null;
  let runsError: ToolError | null = null;
  const runs: CronRun[] = [];
  try {
    zone = requireZone(zoneInput, "timeZone");
  } catch (error) {
    runsError = error as ToolError;
  }

  if (zone) {
    const tokens = quartz
      ? split.tokens
          .slice(0, 6)
          .map((token, index) => (index === 5 ? quartzDow(token) : token))
      : split.tokens;
    const inYear = quartz ? yearFilter(split.tokens[6]) : null;
    try {
      const iterator = CronExpressionParser.parse(tokens.join(" "), {
        tz: zone,
        currentDate: now,
      });
      const dateFormat = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: zone,
      });
      const weekdayFormat = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: zone,
      });
      const pad = (value: number) => String(value).padStart(2, "0");
      const withSeconds = split.syntax !== "unix";
      for (let step = 0; runs.length < count && step < 5000; step += 1) {
        let date: Date;
        try {
          date = iterator.next().toDate();
        } catch {
          break;
        }
        const clock = wallClockIn(date, zone);
        if (inYear && !inYear(clock.year)) {
          if (clock.year > 2099) break;
          continue;
        }
        runs.push({
          iso: isoInZone(date, zone),
          date: dateFormat.format(date),
          weekday: weekdayFormat.format(date),
          time: `${pad(clock.hour)}:${pad(clock.minute)}${withSeconds ? `:${pad(clock.second)}` : ""}`,
          relative: relative(date, locale, now),
        });
      }
      if (runs.length === 0) {
        runsError = new ToolError({
          tr: "Bu ifade bundan sonra hiç çalışmaz.",
          en: "This expression will never run again.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      runsError = /day of month/i.test(message)
        ? never()
        : /W/i.test(dom)
          ? new ToolError({
              tr: "Sonraki çalışmalar W (en yakın hafta içi) ile hesaplanamıyor; açıklama yine geçerli.",
              en: "The next runs cannot be computed with W (nearest weekday); the sentence still holds.",
            })
          : new ToolError({
              tr: "Sonraki çalışmalar hesaplanamadı.",
              en: "The next runs could not be computed.",
            });
    }
  }

  const header = locale === "tr" ? "Sonraki çalışmalar" : "Next runs";
  const text = [
    sentence,
    ...(runs.length > 0
      ? [
          "",
          `${header} (${zone}):`,
          ...runs.map((run) => `  ${run.date} ${run.weekday} ${run.time}`),
        ]
      : []),
  ].join("\n");

  return { split, sentence, warnings, runs, runsError, zone, text };
}
