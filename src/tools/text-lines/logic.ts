/**
 * The line operations that otherwise mean opening an editor.
 *
 * Sorting is `localeCompare` with the Turkish collation, so ç sorts after c
 * and ı before i rather than both landing wherever their code point happens to
 * be — the order a Turkish list is expected to come back in.
 */
export type Operation =
  | "sort"
  | "sort-desc"
  | "unique"
  | "reverse"
  | "shuffle"
  | "number"
  | "trim"
  | "remove-empty"
  | "count-duplicates";

export type Options = {
  operation: Operation;
  caseSensitive: boolean;
};

export function processLines(input: string, options: Options): string {
  if (!input) return "";

  const lines = input.split(/\r?\n/);
  const collator = new Intl.Collator("tr", {
    numeric: true,
    sensitivity: "variant",
  });
  const key = (line: string) =>
    options.caseSensitive ? line : line.toLocaleLowerCase("tr");

  switch (options.operation) {
    case "sort":
      return [...lines]
        .sort((a, b) => collator.compare(key(a), key(b)))
        .join("\n");
    case "sort-desc":
      return [...lines]
        .sort((a, b) => collator.compare(key(b), key(a)))
        .join("\n");
    case "unique": {
      const seen = new Set<string>();
      return lines
        .filter((line) => {
          const id = key(line);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .join("\n");
    }
    case "reverse":
      return [...lines].reverse().join("\n");
    case "shuffle": {
      const shuffled = [...lines];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        // crypto rather than Math.random: this is also how someone picks a
        // winner out of a list, and a biased shuffle there is a real problem.
        const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.join("\n");
    }
    case "number": {
      const width = String(lines.length).length;
      return lines
        .map(
          (line, index) => `${String(index + 1).padStart(width, " ")}. ${line}`,
        )
        .join("\n");
    }
    case "trim":
      return lines.map((line) => line.trim()).join("\n");
    case "remove-empty":
      return lines.filter((line) => line.trim() !== "").join("\n");
    case "count-duplicates": {
      const counts = new Map<string, { line: string; count: number }>();
      for (const line of lines) {
        const id = key(line);
        const entry = counts.get(id);
        if (entry) entry.count += 1;
        else counts.set(id, { line, count: 1 });
      }
      return [...counts.values()]
        .sort((a, b) => b.count - a.count || collator.compare(a.line, b.line))
        .map(
          (entry) => `${String(entry.count).padStart(4, " ")}  ${entry.line}`,
        )
        .join("\n");
    }
  }
}
