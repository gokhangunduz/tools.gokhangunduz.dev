/**
 * A unified diff of two texts.
 *
 * `diff` does the work, which matters because a hand-rolled line comparison
 * gets the common case wrong: inserting one line at the top must not report
 * every following line as changed, and that requires an actual LCS.
 */
export type Granularity = "line" | "word" | "character";

export async function diffText(
  left: string,
  right: string,
  granularity: Granularity,
  ignoreCase: boolean,
): Promise<string> {
  if (!left && !right) return "";

  const jsdiff = await import("diff");
  // `ignoreCase` is honoured by every one of these at run time — it is handled
  // in the shared base — but the published types only list it on the character
  // and word variants.
  const options = { ignoreCase } as Parameters<typeof jsdiff.diffLines>[2];

  const parts =
    granularity === "line"
      ? jsdiff.diffLines(normalize(left), normalize(right), options)
      : granularity === "word"
        ? jsdiff.diffWords(left, right, options)
        : jsdiff.diffChars(left, right, options);

  if (granularity === "line") {
    return parts
      .flatMap((part) => {
        const marker = part.added ? "+" : part.removed ? "-" : " ";
        return part.value
          .replace(/\n$/, "")
          .split("\n")
          .map((line) => `${marker} ${line}`);
      })
      .join("\n");
  }

  // Inline markers, so a word- or character-level change reads in place
  // rather than as two separate blocks.
  return parts
    .map((part) =>
      part.added
        ? `{+${part.value}+}`
        : part.removed
          ? `[-${part.value}-]`
          : part.value,
    )
    .join("");
}

function normalize(value: string): string {
  // CRLF against LF would otherwise report every line as changed — which is
  // true, and never what the person comparing two files wants to see.
  return value.replace(/\r\n/g, "\n");
}

export async function countChanges(
  left: string,
  right: string,
  granularity: Granularity,
  ignoreCase: boolean,
): Promise<{ added: number; removed: number }> {
  const jsdiff = await import("diff");
  const options = { ignoreCase } as Parameters<typeof jsdiff.diffLines>[2];
  const parts =
    granularity === "line"
      ? jsdiff.diffLines(normalize(left), normalize(right), options)
      : granularity === "word"
        ? jsdiff.diffWords(left, right, options)
        : jsdiff.diffChars(left, right, options);

  let added = 0;
  let removed = 0;
  for (const part of parts) {
    const size = granularity === "line" ? (part.count ?? 0) : part.value.length;
    if (part.added) added += size;
    else if (part.removed) removed += size;
  }
  return { added, removed };
}
