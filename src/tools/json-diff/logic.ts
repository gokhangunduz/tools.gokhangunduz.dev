import { parseJson } from "@/lib/json";

/**
 * A structural diff of two JSON documents.
 *
 * A text diff of JSON reports a reordered key as a change and a reformatted
 * file as a rewrite. This compares values by path, so the answer is the set of
 * things that actually differ — which is the question being asked when two
 * config files behave differently.
 */
export type Change = {
  path: string;
  kind: "added" | "removed" | "changed";
  left?: unknown;
  right?: unknown;
};

export function diffJson(
  leftText: string,
  rightText: string,
  ignoreArrayOrder: boolean,
): string {
  if (!leftText.trim() && !rightText.trim()) return "";

  const left = parseJson(leftText || "null");
  const right = parseJson(rightText || "null");
  const changes = compare(left, right, "$", ignoreArrayOrder);

  if (changes.length === 0)
    return "İki belge aynı. / The two documents are identical.";

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

export function compare(
  left: unknown,
  right: unknown,
  path: string,
  ignoreArrayOrder: boolean,
): Change[] {
  if (Object.is(left, right)) return [];

  if (Array.isArray(left) && Array.isArray(right)) {
    if (ignoreArrayOrder) {
      const leftKeys = left.map((item) => JSON.stringify(item));
      const rightKeys = right.map((item) => JSON.stringify(item));
      const changes: Change[] = [];
      for (const [index, key] of leftKeys.entries()) {
        if (!rightKeys.includes(key)) {
          changes.push({
            path: `${path}[${index}]`,
            kind: "removed",
            left: left[index],
          });
        }
      }
      for (const [index, key] of rightKeys.entries()) {
        if (!leftKeys.includes(key)) {
          changes.push({
            path: `${path}[${index}]`,
            kind: "added",
            right: right[index],
          });
        }
      }
      return changes;
    }

    const changes: Change[] = [];
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
      if (i >= left.length) {
        changes.push({ path: `${path}[${i}]`, kind: "added", right: right[i] });
      } else if (i >= right.length) {
        changes.push({ path: `${path}[${i}]`, kind: "removed", left: left[i] });
      } else {
        changes.push(
          ...compare(left[i], right[i], `${path}[${i}]`, ignoreArrayOrder),
        );
      }
    }
    return changes;
  }

  if (isObject(left) && isObject(right)) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
    return keys.flatMap((key) => {
      const child = `${path}.${key}`;
      if (!(key in left))
        return [{ path: child, kind: "added" as const, right: right[key] }];
      if (!(key in right))
        return [{ path: child, kind: "removed" as const, left: left[key] }];
      return compare(left[key], right[key], child, ignoreArrayOrder);
    });
  }

  return [{ path, kind: "changed", left, right }];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function show(value: unknown): string {
  const json = JSON.stringify(value);
  return json === undefined
    ? "undefined"
    : json.length > 120
      ? `${json.slice(0, 117)}…`
      : json;
}

export function countChanges(
  leftText: string,
  rightText: string,
  ignoreArrayOrder: boolean,
): number {
  try {
    return compare(
      parseJson(leftText || "null"),
      parseJson(rightText || "null"),
      "$",
      ignoreArrayOrder,
    ).length;
  } catch {
    return 0;
  }
}
