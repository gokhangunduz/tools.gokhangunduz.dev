import type { Locale } from "@/i18n";
import { ToolError } from "../text-tool";

/**
 * A cron expression in words, and the next times it will actually fire.
 *
 * The sentence alone is not enough: "0 0 31 2 *" reads fine and never runs,
 * and a five-field expression with a day-of-month *and* a day-of-week is an
 * OR, not an AND, which is the single most common way a schedule surprises
 * someone. Printing the next runs is what makes those visible.
 */
export async function explainCron(
  input: string,
  locale: Locale,
  timeZone: string,
  count: number,
): Promise<string> {
  const expression = input.trim();
  if (!expression) return "";

  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [cronstrue, { CronExpressionParser }] = await Promise.all([
    import("cronstrue/i18n"),
    import("cron-parser"),
  ]);

  let sentence: string;
  try {
    sentence = cronstrue.default.toString(expression, {
      locale,
      throwExceptionOnParseError: true,
      verbose: false,
    });
  } catch (cause) {
    throw new ToolError({
      tr: `Cron ifadesi anlaşılmadı: ${cause instanceof Error ? cause.message : String(cause)}`,
      en: `Could not read the cron expression: ${cause instanceof Error ? cause.message : String(cause)}`,
    });
  }

  let iterator;
  try {
    iterator = CronExpressionParser.parse(expression, { tz: zone });
  } catch (cause) {
    throw new ToolError({
      tr: `Cron ifadesi geçersiz: ${cause instanceof Error ? cause.message : ""}`,
      en: `Invalid cron expression: ${cause instanceof Error ? cause.message : ""}`,
    });
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: zone,
  });

  const runs: string[] = [];
  for (let i = 0; i < count; i += 1) {
    try {
      runs.push(formatter.format(iterator.next().toDate()));
    } catch {
      // A date-bounded expression whose window has passed. An impossible date
      // like 31 February is refused by the parser above instead.
      break;
    }
  }

  const header = locale === "tr" ? "Sonraki çalışmalar" : "Next runs";
  const none =
    locale === "tr"
      ? "Bu ifade bir daha hiç çalışmaz."
      : "This expression will never run again.";

  return [
    sentence,
    "",
    `${header} (${zone}):`,
    ...(runs.length > 0 ? runs.map((run) => `  ${run}`) : [`  ${none}`]),
  ].join("\n");
}
