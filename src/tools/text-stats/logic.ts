/**
 * What a piece of text is made of.
 *
 * Characters are counted by code point and by grapheme, not by `length`: an
 * emoji is one thing to a reader, two UTF-16 units to `.length`, and four
 * bytes on the wire. A tweet, an SMS and a database column each care about a
 * different one of those three, which is why all three are printed.
 */
export function analyze(input: string, locale: string): string {
  if (!input) return "";

  const codePoints = [...input];
  const graphemes = countGraphemes(input, locale);
  const bytes = new TextEncoder().encode(input).length;
  const words = input.trim() ? (input.trim().match(/\S+/g)?.length ?? 0) : 0;
  const lines = input.split(/\r?\n/).length;
  const paragraphs = input
    .split(/\r?\n\s*\r?\n/)
    .filter((block) => block.trim() !== "").length;
  const sentences = (input.match(/[^.!?…]+[.!?…]+/g) ?? []).length;
  const letters = (input.match(/\p{L}/gu) ?? []).length;
  const digits = (input.match(/\p{Nd}/gu) ?? []).length;
  const spaces = (input.match(/\s/gu) ?? []).length;

  const rows: [string, string | number][] = [
    ["karakter / characters", graphemes],
    ["kod noktası / code points", codePoints.length],
    ["UTF-16 birimi / UTF-16 units", input.length],
    ["bayt (UTF-8) / bytes", bytes],
    ["kelime / words", words],
    ["cümle / sentences", sentences],
    ["satır / lines", lines],
    ["paragraf / paragraphs", paragraphs],
    ["harf / letters", letters],
    ["rakam / digits", digits],
    ["boşluk / whitespace", spaces],
    ["okuma süresi / reading time", readingTime(words)],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
    .join("\n");
}

/** Counts what a reader sees: a family emoji is one character, not seven. */
function countGraphemes(input: string, locale: string): number {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    return [...segmenter.segment(input)].length;
  }
  return [...input].length;
}

/** 200 words a minute, the figure typography references settle on. */
function readingTime(words: number): string {
  if (words === 0) return "0 sn / s";
  const seconds = Math.round((words / 200) * 60);
  if (seconds < 60) return `${seconds} sn / s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} dk ${seconds % 60} sn / ${minutes} min ${seconds % 60} s`;
}
