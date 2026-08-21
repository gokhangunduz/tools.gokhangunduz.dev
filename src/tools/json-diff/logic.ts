import type { Localized } from "@/i18n";
import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * A structural diff of two JSON documents.
 *
 * A text diff of JSON reports a reordered key as a change and a reformatted
 * file as a rewrite. This compares values by path, so the answer is the set of
 * things that actually differ — which is the question being asked when two
 * config files behave differently.
 *
 * Arrays are aligned by their longest common subsequence, so an item inserted
 * at the front is one addition rather than a change at every index. Objects
 * that carry an `id` (or a `key`) are matched on it, so an edited item is a
 * change inside it rather than a removal and an addition.
 */
export type Change = {
  path: string;
  kind: "added" | "removed" | "changed";
  left?: unknown;
  right?: unknown;
};

export type Side = "left" | "right";

const SIDE_NAMES: Record<Side, Localized> = {
  left: { tr: "Eski JSON", en: "Before" },
  right: { tr: "Yeni JSON", en: "After" },
};

/** Parses one side, and names that side and the position when it is not JSON. */
export function parseSide(text: string, side: Side): unknown {
  try {
    return parseJson(text);
  } catch (cause) {
    if (!(cause instanceof ToolError)) throw cause;
    const name = SIDE_NAMES[side];
    const detail = cause.at
      ? cause.detail
      : {
          tr: `${name.tr}: ${cause.detail.tr}`,
          en: `${name.en}: ${cause.detail.en}`,
        };
    throw new ToolError(detail, { at: cause.at, field: side });
  }
}

/** The changes between two documents, or null while either side is blank. */
export function diffJson(
  leftText: string,
  rightText: string,
  ignoreArrayOrder: boolean,
): Change[] | null {
  if (!leftText.trim() || !rightText.trim()) return null;
  const left = parseSide(leftText, "left");
  const right = parseSide(rightText, "right");
  return compare(left, right, "$", ignoreArrayOrder);
}

export function compare(
  left: unknown,
  right: unknown,
  path: string,
  ignoreArrayOrder: boolean,
): Change[] {
  if (Object.is(left, right)) return [];

  if (Array.isArray(left) && Array.isArray(right)) {
    return ignoreArrayOrder
      ? compareAsMultiset(left, right, path)
      : compareAligned(left, right, path, ignoreArrayOrder);
  }

  if (isObject(left) && isObject(right)) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
    return keys.flatMap((key) => {
      const child = childPath(path, key);
      if (!(key in left))
        return [{ path: child, kind: "added" as const, right: right[key] }];
      if (!(key in right))
        return [{ path: child, kind: "removed" as const, left: left[key] }];
      return compare(left[key], right[key], child, ignoreArrayOrder);
    });
  }

  return [{ path, kind: "changed", left, right }];
}

/** Every item counts, so [1, 1, 2] against [1, 2] is one removed 1. */
function compareAsMultiset(
  left: unknown[],
  right: unknown[],
  path: string,
): Change[] {
  const remaining = new Map<string, number>();
  for (const item of right) {
    const key = canonical(item);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }
  const changes: Change[] = [];
  left.forEach((item, index) => {
    const key = canonical(item);
    const count = remaining.get(key) ?? 0;
    if (count > 0) remaining.set(key, count - 1);
    else
      changes.push({ path: `${path}[${index}]`, kind: "removed", left: item });
  });
  right.forEach((item, index) => {
    const key = canonical(item);
    const count = remaining.get(key) ?? 0;
    if (count > 0) {
      remaining.set(key, count - 1);
      changes.push({ path: `${path}[${index}]`, kind: "added", right: item });
    }
  });
  return changes;
}

const LCS_LIMIT = 4_000_000;

function compareAligned(
  left: unknown[],
  right: unknown[],
  path: string,
  ignoreArrayOrder: boolean,
): Change[] {
  const field = keyField(left, right);
  const identity = field
    ? (item: unknown) =>
        JSON.stringify((item as Record<string, unknown>)[field]) ?? ""
    : canonical;
  const leftIds = left.map(identity);
  const rightIds = right.map(identity);
  const pairs = align(leftIds, rightIds);

  const changes: Change[] = [];
  let i = 0;
  let j = 0;
  const gap = (untilLeft: number, untilRight: number) => {
    // Unmatched items between two anchors are paired by position first:
    // [1, 2, 3] against [1, 5, 3] is a changed $[1], not a removal and an addition.
    while (!field && i < untilLeft && j < untilRight) {
      changes.push(
        ...compare(left[i], right[j], `${path}[${j}]`, ignoreArrayOrder),
      );
      i++;
      j++;
    }
    for (; i < untilLeft; i++)
      changes.push({ path: `${path}[${i}]`, kind: "removed", left: left[i] });
    for (; j < untilRight; j++)
      changes.push({ path: `${path}[${j}]`, kind: "added", right: right[j] });
  };
  for (const [li, rj] of pairs) {
    gap(li, rj);
    changes.push(
      ...compare(left[li], right[rj], `${path}[${rj}]`, ignoreArrayOrder),
    );
    i = li + 1;
    j = rj + 1;
  }
  gap(left.length, right.length);
  return changes;
}

/** `id` or `key`, when every item is an object that has one; items are then matched on it. */
function keyField(left: unknown[], right: unknown[]): string | undefined {
  const items = [...left, ...right];
  return ["id", "key"].find(
    (name) =>
      items.length > 0 &&
      items.every(
        (item) =>
          isObject(item) &&
          name in item &&
          (typeof item[name] === "string" || typeof item[name] === "number"),
      ),
  );
}

/** Index pairs of a longest common subsequence, after the shared ends are taken off. */
function align(a: string[], b: string[]): [number, number][] {
  const pairs: [number, number][] = [];
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    pairs.push([start, start]);
    start++;
  }
  let endA = a.length;
  let endB = b.length;
  const tail: [number, number][] = [];
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
    tail.unshift([endA, endB]);
  }

  const n = endA - start;
  const m = endB - start;
  if (n > 0 && m > 0 && n * m <= LCS_LIMIT) {
    const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let x = n - 1; x >= 0; x--) {
      for (let y = m - 1; y >= 0; y--) {
        table[x][y] =
          a[start + x] === b[start + y]
            ? table[x + 1][y + 1] + 1
            : Math.max(table[x + 1][y], table[x][y + 1]);
      }
    }
    let x = 0;
    let y = 0;
    while (x < n && y < m) {
      if (a[start + x] === b[start + y]) {
        pairs.push([start + x, start + y]);
        x++;
        y++;
      } else if (table[x + 1][y] >= table[x][y + 1]) x++;
      else y++;
    }
  }
  return [...pairs, ...tail];
}

/** JSON with sorted keys, so two equal values serialize the same. */
export function canonical(value: unknown): string {
  return JSON.stringify(sortKeys(value)) ?? "undefined";
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}

function childPath(path: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function show(value: unknown, space?: number): string {
  return JSON.stringify(value, null, space) ?? "undefined";
}

/** The plain-text form Copy takes: one change per entry, full values. */
export function formatChanges(changes: Change[]): string {
  return changes
    .map((change) => {
      if (change.kind === "added")
        return `+ ${change.path} = ${show(change.right)}`;
      if (change.kind === "removed")
        return `- ${change.path} = ${show(change.left)}`;
      return `~ ${change.path}\n    - ${show(change.left)}\n    + ${show(change.right)}`;
    })
    .join("\n");
}
