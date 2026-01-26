/**
 * Infers a type from a JSON sample.
 *
 * One inference pass, four printers. The interesting part is merging: an array
 * of objects is described by the union of what its elements had, with a field
 * that is missing from any of them marked optional. That is what makes the
 * output usable against a real API response, where the second page of results
 * is the one that reveals `deleted_at` can be null.
 */
export type Inferred =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "integer" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "unknown" }
  | { kind: "array"; items: Inferred }
  | { kind: "object"; fields: Field[] }
  | { kind: "union"; options: Inferred[] };

export type Field = { name: string; type: Inferred; optional: boolean };

export function infer(value: unknown): Inferred {
  if (value === null) return { kind: "null" };
  if (typeof value === "string") return { kind: "string" };
  if (typeof value === "boolean") return { kind: "boolean" };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { kind: "integer" } : { kind: "number" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0)
      return { kind: "array", items: { kind: "unknown" } };
    return {
      kind: "array",
      items: value.map(infer).reduce(merge),
    };
  }

  if (typeof value === "object") {
    return {
      kind: "object",
      fields: Object.entries(value).map(([name, item]) => ({
        name,
        type: infer(item),
        optional: false,
      })),
    };
  }

  return { kind: "unknown" };
}

/** Combines two inferences of the same position into one that covers both. */
export function merge(a: Inferred, b: Inferred): Inferred {
  if (same(a, b)) return a;

  // A number seen as both 1 and 1.5 is a number, not a union.
  if (numeric(a) && numeric(b)) return { kind: "number" };

  if (a.kind === "array" && b.kind === "array") {
    return { kind: "array", items: merge(a.items, b.items) };
  }

  if (a.kind === "object" && b.kind === "object") {
    const names = [...new Set([...a.fields, ...b.fields].map((f) => f.name))];
    return {
      kind: "object",
      fields: names.map((name) => {
        const left = a.fields.find((f) => f.name === name);
        const right = b.fields.find((f) => f.name === name);
        if (left && right) {
          return {
            name,
            type: merge(left.type, right.type),
            optional: left.optional || right.optional,
          };
        }
        // Present in one sample and not the other: optional, by definition.
        return { name, type: (left ?? right)!.type, optional: true };
      }),
    };
  }

  const options = [...flatten(a), ...flatten(b)];
  const unique: Inferred[] = [];
  for (const option of options) {
    if (!unique.some((existing) => same(existing, option))) unique.push(option);
  }
  return unique.length === 1 ? unique[0] : { kind: "union", options: unique };
}

function flatten(value: Inferred): Inferred[] {
  return value.kind === "union" ? value.options : [value];
}

function numeric(value: Inferred): boolean {
  return value.kind === "number" || value.kind === "integer";
}

function same(a: Inferred, b: Inferred): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "array" && b.kind === "array") return same(a.items, b.items);
  if (a.kind === "object" && b.kind === "object") {
    return (
      a.fields.length === b.fields.length &&
      a.fields.every((field, index) => {
        const other = b.fields[index];
        return (
          field.name === other.name &&
          field.optional === other.optional &&
          same(field.type, other.type)
        );
      })
    );
  }
  if (a.kind === "union" && b.kind === "union") {
    return (
      a.options.length === b.options.length &&
      a.options.every((option, index) => same(option, b.options[index]))
    );
  }
  return true;
}

/** A valid identifier in the target language, derived from a JSON key. */
export function pascalCase(name: string): string {
  const parts = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const joined = parts
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  return /^[A-Za-z]/.test(joined) ? joined : `F${joined || "ield"}`;
}
