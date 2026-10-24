export type Granularity = "line" | "word" | "character";

export type Segment = { type: "same" | "added" | "removed"; text: string };

export type Row = {
  type: "same" | "added" | "removed";
  oldNo?: number;
  newNo?: number;
  text: string;
  inline?: Segment[];
};

export type DiffOptions = {
  granularity: Granularity;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
};

export type TextDiff =
  | { mode: "line"; rows: Row[]; added: number; removed: number }
  | { mode: "inline"; segments: Segment[]; added: number; removed: number };

type JsDiff = typeof import("diff");

function normalize(value: string): string {
  const unix = value.replace(/\r\n/g, "\n");
  return unix && !unix.endsWith("\n") ? `${unix}\n` : unix;
}

function lineParts(
  jsdiff: JsDiff,
  left: string,
  right: string,
  o: DiffOptions,
) {
  const options = {
    ignoreCase: o.ignoreCase,
    ignoreWhitespace: o.ignoreWhitespace,
  } as Parameters<JsDiff["diffLines"]>[2];
  return jsdiff.diffLines(normalize(left), normalize(right), options);
}

function splitLines(value: string): string[] {
  return value.replace(/\n$/, "").split("\n");
}

export async function diffText(
  left: string,
  right: string,
  options: DiffOptions,
): Promise<TextDiff> {
  const jsdiff = await import("diff");

  if (options.granularity !== "line") {
    const settings = { ignoreCase: options.ignoreCase };
    const parts =
      options.granularity === "word"
        ? jsdiff.diffWords(left, right, settings)
        : jsdiff.diffChars(left, right, settings);
    const measure = (text: string) =>
      options.granularity === "word"
        ? (text.match(/\S+/g)?.length ?? 0)
        : [...text].length;
    let added = 0;
    let removed = 0;
    const segments = parts.map((part): Segment => {
      if (part.added) added += measure(part.value);
      if (part.removed) removed += measure(part.value);
      return {
        type: part.added ? "added" : part.removed ? "removed" : "same",
        text: part.value,
      };
    });
    return { mode: "inline", segments, added, removed };
  }

  const rows: Row[] = [];
  let oldNo = 0;
  let newNo = 0;
  let added = 0;
  let removed = 0;
  let pendingRemoved: Row[] = [];

  if (!left && !right) return { mode: "line", rows, added, removed };

  for (const part of lineParts(jsdiff, left, right, options)) {
    const lines = splitLines(part.value);
    if (part.removed) {
      pendingRemoved = lines.map((text) => ({
        type: "removed",
        oldNo: ++oldNo,
        text,
      }));
      rows.push(...pendingRemoved);
      removed += lines.length;
      continue;
    }
    if (part.added) {
      lines.forEach((text, index) => {
        const row: Row = { type: "added", newNo: ++newNo, text };
        const partner = pendingRemoved[index];
        if (partner) pair(jsdiff, partner, row, options.ignoreCase);
        rows.push(row);
      });
      added += lines.length;
      pendingRemoved = [];
      continue;
    }
    pendingRemoved = [];
    for (const text of lines) {
      rows.push({ type: "same", oldNo: ++oldNo, newNo: ++newNo, text });
    }
  }
  return { mode: "line", rows, added, removed };
}

function pair(jsdiff: JsDiff, removed: Row, added: Row, ignoreCase: boolean) {
  const parts = jsdiff.diffWordsWithSpace(removed.text, added.text, {
    ignoreCase,
  });
  const same = parts.filter((part) => !part.added && !part.removed);

  const shared = same.reduce((sum, part) => sum + part.value.trim().length, 0);
  if (shared < Math.min(removed.text.length, added.text.length) / 3) return;
  removed.inline = parts
    .filter((part) => !part.added)
    .map((part) => ({
      type: part.removed ? "removed" : "same",
      text: part.value,
    }));
  added.inline = parts
    .filter((part) => !part.removed)
    .map((part) => ({ type: part.added ? "added" : "same", text: part.value }));
}

export function formatDiff(diff: TextDiff): string {
  if (diff.mode === "line") {
    return diff.rows
      .map(
        (row) =>
          `${row.type === "added" ? "+" : row.type === "removed" ? "-" : " "} ${row.text}`,
      )
      .join("\n");
  }
  return diff.segments
    .map((segment) =>
      segment.type === "added"
        ? `{+${segment.text}+}`
        : segment.type === "removed"
          ? `[-${segment.text}-]`
          : segment.text,
    )
    .join("");
}

export function isIdentical(diff: TextDiff): boolean {
  return diff.added === 0 && diff.removed === 0;
}

export type Block = Row | { type: "skip"; count: number };

export function collapse(rows: Row[], context: number): Block[] {
  const blocks: Block[] = [];
  let run: Row[] = [];
  const flush = (atStart: boolean, atEnd: boolean) => {
    const head = atStart ? 0 : context;
    const tail = atEnd ? 0 : context;

    if (run.length > head + tail + (context > 0 ? 1 : 0)) {
      blocks.push(...run.slice(0, head));
      blocks.push({ type: "skip", count: run.length - head - tail });
      blocks.push(...run.slice(run.length - tail));
    } else {
      blocks.push(...run);
    }
    run = [];
  };
  let seenChange = false;
  for (const row of rows) {
    if (row.type === "same") {
      run.push(row);
      continue;
    }
    if (run.length) flush(!seenChange, false);
    seenChange = true;
    blocks.push(row);
  }
  if (run.length) {
    if (seenChange) flush(false, true);
    else blocks.push(...run);
  }
  return blocks;
}

export async function toPatch(
  left: string,
  right: string,
  ignoreWhitespace: boolean,
): Promise<string> {
  const jsdiff = await import("diff");
  return jsdiff.createTwoFilesPatch(
    "a",
    "b",
    left.replace(/\r\n/g, "\n"),
    right.replace(/\r\n/g, "\n"),
    undefined,
    undefined,
    { ignoreWhitespace },
  );
}
