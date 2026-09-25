/**
 * Set operations on two lists of lines.
 *
 * The answer people want is usually one of four: what is in both, what is only
 * on the left, what is only on the right, or everything with a marker. Doing
 * it in a spreadsheet is a VLOOKUP; doing it here is a paste.
 */
export type Operation = "both" | "left-only" | "right-only" | "all";

export type Options = {
  operation: Operation;
  caseSensitive: boolean;
  trim: boolean;
  sort: boolean;
};

export function compareLists(
  left: string,
  right: string,
  options: Options,
): string {
  const leftLines = split(left, options);
  const rightLines = split(right, options);

  const leftKeys = new Set(leftLines.map((line) => key(line, options)));
  const rightKeys = new Set(rightLines.map((line) => key(line, options)));

  let result: string[];

  switch (options.operation) {
    case "both":
      result = unique(leftLines, options).filter((line) =>
        rightKeys.has(key(line, options)),
      );
      break;
    case "left-only":
      result = unique(leftLines, options).filter(
        (line) => !rightKeys.has(key(line, options)),
      );
      break;
    case "right-only":
      result = unique(rightLines, options).filter(
        (line) => !leftKeys.has(key(line, options)),
      );
      break;
    case "all": {
      const marked = [
        ...unique(leftLines, options).map((line) =>
          rightKeys.has(key(line, options)) ? `  ${line}` : `- ${line}`,
        ),
        ...unique(rightLines, options)
          .filter((line) => !leftKeys.has(key(line, options)))
          .map((line) => `+ ${line}`),
      ];
      result = options.sort ? [...marked].sort() : marked;
      return result.join("\n");
    }
  }

  return (options.sort ? [...result].sort() : result).join("\n");
}

function split(value: string, options: Options): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => (options.trim ? line.trim() : line))
    .filter((line) => line !== "");
}

function key(line: string, options: Options): string {
  // Turkish needs the explicit locale here: the default lowercase maps "I" to
  // "i" rather than "ı", which would call "IŞIK" and "ışık" different lines.
  return options.caseSensitive ? line : line.toLocaleLowerCase("tr");
}

function unique(lines: string[], options: Options): string[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const id = key(line, options);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function summarize(left: string, right: string, options: Options) {
  const leftLines = unique(split(left, options), options);
  const rightLines = unique(split(right, options), options);
  const rightKeys = new Set(rightLines.map((line) => key(line, options)));
  const shared = leftLines.filter((line) =>
    rightKeys.has(key(line, options)),
  ).length;
  return {
    left: leftLines.length,
    right: rightLines.length,
    shared,
  };
}
