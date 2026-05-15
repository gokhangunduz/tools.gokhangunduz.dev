import { ToolError } from "../text-tool";

/**
 * Line endings, counted and converted.
 *
 * A file with mixed endings is the thing that makes a diff show every line as
 * changed, and it is invisible in an editor. Counting them first is most of
 * the value: it tells you whether the file is CRLF, LF or — the actual
 * problem — both.
 */
export type Ending = "lf" | "crlf" | "cr";

const SEQUENCES: Record<Ending, string> = {
  lf: "\n",
  crlf: "\r\n",
  cr: "\r",
};

export function convert(input: string, target: Ending): string {
  if (!input) return "";
  // Normalised to LF first, so mixed input converges rather than producing
  // "\r\r\n" out of a CRLF line that was converted twice.
  const normalized = input.replace(/\r\n|\r|\n/g, "\n");
  return target === "lf"
    ? normalized
    : normalized.replace(/\n/g, SEQUENCES[target]);
}

export function count(input: string): { crlf: number; lf: number; cr: number } {
  const crlf = (input.match(/\r\n/g) ?? []).length;
  const lf = (input.match(/(?<!\r)\n/g) ?? []).length;
  const cr = (input.match(/\r(?!\n)/g) ?? []).length;
  return { crlf, lf, cr };
}

export function describe(input: string, locale: "tr" | "en"): string {
  if (!input) return "";

  const counts = count(input);
  const kinds = [counts.crlf > 0, counts.lf > 0, counts.cr > 0].filter(
    Boolean,
  ).length;

  if (kinds === 0) {
    throw new ToolError({
      tr: "Metinde sat\u0131r sonu yok.",
      en: "There are no line endings in the text.",
    });
  }

  const lines = [
    `CRLF (\\r\\n)  ${counts.crlf}`,
    `LF   (\\n)    ${counts.lf}`,
    `CR   (\\r)    ${counts.cr}`,
  ];

  if (kinds > 1) {
    lines.push(
      "",
      locale === "tr"
        ? "\u26a0 Kar\u0131\u015f\u0131k sat\u0131r sonlar\u0131 \u2014 diff'in her sat\u0131r\u0131 de\u011fi\u015fmi\u015f g\u00f6stermesinin sebebi budur."
        : "\u26a0 Mixed line endings \u2014 this is why a diff shows every line as changed.",
    );
  }

  return lines.join("\n");
}
