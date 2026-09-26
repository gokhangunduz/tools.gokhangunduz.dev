import type { Localized } from "@/i18n";
import { parseJson } from "@/lib/json";
import { infer, pascalCase, type Field, type Inferred } from "./infer";

/**
 * Prints an inferred type as TypeScript, Zod, Go or JSON Schema.
 *
 * Nested objects become named types rather than one deeply inlined shape:
 * an inline type three levels down is unreadable, and a named one is what
 * anyone would have written by hand.
 */
export type Target = "typescript" | "zod" | "go" | "json-schema";

export type TypesResult = {
  text: string;
  /** Named declarations printed, for the targets that name them. */
  declarations: number | null;
  /** Fields only ever seen as null, whose real type the sample does not show. */
  nullOnly: number;
};

export function convert(
  input: string,
  target: Target,
  rootName: string,
): TypesResult {
  if (!input.trim()) return { text: "", declarations: null, nullOnly: 0 };

  const value = parseJson(input);
  const root = infer(value);
  const nullOnly = countNullOnly(root);

  if (target === "typescript") {
    const { text, count } = printTypeScript(
      root,
      pascalCase(rootName || "Root"),
    );
    return { text, declarations: count, nullOnly };
  }
  if (target === "go") {
    const { text, count } = printGo(root, goName(rootName || "Root"));
    return { text, declarations: count, nullOnly };
  }
  const text =
    target === "zod"
      ? printZod(root, pascalCase(rootName || "Root"))
      : JSON.stringify(jsonSchema(root), null, 2);
  return { text, declarations: null, nullOnly };
}

const TARGET_LABELS: Record<Target, string> = {
  typescript: "TypeScript",
  zod: "Zod",
  go: "Go",
  "json-schema": "JSON Schema",
};

export function typesNote(result: TypesResult, target: Target): Localized {
  const label = TARGET_LABELS[target];
  const head =
    result.declarations === null
      ? { tr: label, en: label }
      : {
          tr: `${result.declarations} tip · ${label}`,
          en: `${result.declarations} ${result.declarations === 1 ? "type" : "types"} · ${label}`,
        };
  if (result.nullOnly === 0) return head;
  return {
    tr: `${head.tr} · ${result.nullOnly} alan yalnız null görüldü`,
    en: `${head.en} · ${result.nullOnly} ${result.nullOnly === 1 ? "field was" : "fields were"} only ever null`,
  };
}

function countNullOnly(value: Inferred): number {
  switch (value.kind) {
    case "array":
      return countNullOnly(value.items);
    case "union":
      return value.options.reduce(
        (sum, option) => sum + countNullOnly(option),
        0,
      );
    case "object":
      return value.fields.reduce(
        (sum, field) =>
          sum + (field.type.kind === "null" ? 1 : countNullOnly(field.type)),
        0,
      );
    default:
      return 0;
  }
}

type ObjectType = Extract<Inferred, { kind: "object" }>;

/**
 * Names for object types: the same shape reuses its name, and a different
 * shape under a name already taken gets its parent's name in front (two
 * `data` objects become `Data` and `OrderData`), then a number.
 */
function namer(reserved: string[] = []) {
  const bySignature = new Map<string, string>();
  const taken = new Set(reserved);
  return (
    value: ObjectType,
    hint: string,
    parent: string | null,
  ): { name: string; fresh: boolean } => {
    const signature = JSON.stringify(value);
    const existing = bySignature.get(signature);
    if (existing) return { name: existing, fresh: false };
    let name = hint;
    if (taken.has(name) && parent) name = `${parent}${hint}`;
    const base = name;
    for (let n = 2; taken.has(name); n++) name = `${base}${n}`;
    taken.add(name);
    bySignature.set(signature, name);
    return { name, fresh: true };
  };
}

/* ─────────────────────────────────────────────────────────── TypeScript ── */

function printTypeScript(
  root: Inferred,
  name: string,
): { text: string; count: number } {
  const declarations: string[] = [];
  const nameFor = namer(root.kind === "object" ? [] : [name]);

  function type(value: Inferred, hint: string, parent: string | null): string {
    switch (value.kind) {
      case "string":
        return "string";
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "unknown | null";
      case "unknown":
        return "unknown";
      case "array":
        return `${wrap(type(value.items, singular(hint), parent))}[]`;
      case "union":
        return value.options
          .map((option) =>
            option.kind === "null" ? "null" : type(option, hint, parent),
          )
          .join(" | ");
      case "object": {
        const { name: own, fresh } = nameFor(value, hint, parent);
        if (!fresh) return own;
        const body = value.fields
          .map(
            (field) =>
              `  ${key(field)}${field.optional ? "?" : ""}: ${type(field.type, pascalCase(field.name), own)};`,
          )
          .join("\n");
        declarations.push(`export interface ${own} {\n${body}\n}`);
        return own;
      }
    }
  }

  const rootType = type(root, name, null);
  if (rootType !== name)
    declarations.push(`export type ${name} = ${rootType};`);
  return {
    text: declarations.reverse().join("\n\n"),
    count: declarations.length,
  };
}

function wrap(value: string): string {
  return value.includes(" | ") ? `(${value})` : value;
}

function key(field: Field): string {
  return /^[A-Za-z_$][\w$]*$/.test(field.name)
    ? field.name
    : JSON.stringify(field.name);
}

/* ────────────────────────────────────────────────────────────────── Zod ── */

function printZod(root: Inferred, name: string): string {
  function schema(value: Inferred, indent: string): string {
    switch (value.kind) {
      case "string":
        return "z.string()";
      case "integer":
        return "z.number().int()";
      case "number":
        return "z.number()";
      case "boolean":
        return "z.boolean()";
      case "null":
        return "z.unknown().nullable()";
      case "unknown":
        return "z.unknown()";
      case "array":
        return `z.array(${schema(value.items, indent)})`;
      case "union":
        return `z.union([${value.options
          .map((option) =>
            option.kind === "null" ? "z.null()" : schema(option, indent),
          )
          .join(", ")}])`;
      case "object": {
        const inner = `${indent}  `;
        const body = value.fields
          .map(
            (field) =>
              `${inner}${key(field)}: ${schema(field.type, inner)}${field.optional ? ".optional()" : ""},`,
          )
          .join("\n");
        return `z.object({\n${body}\n${indent}})`;
      }
    }
  }

  const lower = name[0].toLowerCase() + name.slice(1);
  return [
    `import { z } from "zod";`,
    "",
    `export const ${lower}Schema = ${schema(root, "")};`,
    "",
    `export type ${name} = z.infer<typeof ${lower}Schema>;`,
  ].join("\n");
}

/* ─────────────────────────────────────────────────────────────────── Go ── */

const INITIALISMS = new Set([
  "ID",
  "URL",
  "URI",
  "HTTP",
  "HTTPS",
  "API",
  "JSON",
  "UUID",
  "IP",
  "SQL",
  "HTML",
]);

/** An exported Go identifier, with Go's initialisms: user_id → UserID. */
export function goName(name: string): string {
  const parts = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const joined = parts
    .map((part) => {
      const upper = part.toUpperCase();
      return INITIALISMS.has(upper)
        ? upper
        : part[0].toUpperCase() + part.slice(1);
    })
    .join("");
  return /^[A-Za-z]/.test(joined) ? joined : `F${joined || "ield"}`;
}

function printGo(
  root: Inferred,
  name: string,
): { text: string; count: number } {
  const declarations: string[] = [];
  const nameFor = namer(root.kind === "object" ? [] : [name]);

  function type(value: Inferred, hint: string, parent: string | null): string {
    switch (value.kind) {
      case "string":
        return "string";
      case "integer":
        return "int64";
      case "number":
        return "float64";
      case "boolean":
        return "bool";
      case "null":
      case "unknown":
        return "any";
      case "array":
        return `[]${type(value.items, singular(hint), parent)}`;
      case "union":
        // Go has no sum type; `any` is the honest answer rather than picking
        // one of the observed types and hoping.
        return "any";
      case "object": {
        const { name: own, fresh } = nameFor(value, hint, parent);
        if (!fresh) return own;
        const rows = value.fields.map((field) => {
          const fieldName = goName(field.name);
          const goType = type(field.type, fieldName, own);
          // A pointer for anything optional, so "absent" and "zero value"
          // stay distinguishable — the reason Go structs get this wrong.
          const pointer =
            field.optional && !goType.startsWith("[]") && goType !== "any"
              ? "*"
              : "";
          const omit = field.optional ? ",omitempty" : "";
          return [
            fieldName,
            `${pointer}${goType}`,
            `\`json:"${field.name}${omit}"\``,
          ];
        });
        const nameWidth = Math.max(0, ...rows.map((row) => row[0].length));
        const typeWidth = Math.max(0, ...rows.map((row) => row[1].length));
        const body = rows
          .map(
            ([field, goType, tag]) =>
              `\t${field.padEnd(nameWidth)} ${goType.padEnd(typeWidth)} ${tag}`,
          )
          .join("\n");
        declarations.push(`type ${own} struct {\n${body}\n}`);
        return own;
      }
    }
  }

  const rootType = type(root, name, null);
  if (rootType !== name) declarations.push(`type ${name} = ${rootType}`);
  return {
    text: declarations.reverse().join("\n\n"),
    count: declarations.length,
  };
}

/* ────────────────────────────────────────────────────────── JSON Schema ── */

function jsonSchema(value: Inferred): Record<string, unknown> {
  switch (value.kind) {
    case "string":
      return { type: "string" };
    case "integer":
      return { type: "integer" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "null":
      return { type: "null" };
    case "unknown":
      return {};
    case "array":
      return { type: "array", items: jsonSchema(value.items) };
    case "union":
      return { anyOf: value.options.map(jsonSchema) };
    case "object": {
      const required = value.fields
        .filter((field) => !field.optional)
        .map((field) => field.name);
      return {
        type: "object",
        properties: Object.fromEntries(
          value.fields.map((field) => [field.name, jsonSchema(field.type)]),
        ),
        ...(required.length > 0 ? { required } : {}),
      };
    }
  }
}

/** "Users" → "User", "Addresses" → "Address", so an array's element type gets a sensible name. */
export function singular(name: string): string {
  if (name.length > 3 && name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (/(?:ss|x|ch|sh)es$/.test(name)) return name.slice(0, -2);
  if (name.length > 1 && name.endsWith("s") && !name.endsWith("ss")) {
    return name.slice(0, -1);
  }
  return `${name}Item`;
}
