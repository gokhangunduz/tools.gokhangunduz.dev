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

export function convert(
  input: string,
  target: Target,
  rootName: string,
): string {
  if (!input.trim()) return "";

  const value = parseJson(input);
  const root = infer(value);
  const name = pascalCase(rootName || "Root");

  if (target === "typescript") return printTypeScript(root, name);
  if (target === "zod") return printZod(root, name);
  if (target === "go") return printGo(root, name);
  return JSON.stringify(jsonSchema(root), null, 2);
}

/* ─────────────────────────────────────────────────────────── TypeScript ── */

function printTypeScript(root: Inferred, name: string): string {
  const declarations: string[] = [];

  function type(value: Inferred, hint: string): string {
    switch (value.kind) {
      case "string":
        return "string";
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      case "unknown":
        return "unknown";
      case "array":
        return `${wrap(type(value.items, singular(hint)))}[]`;
      case "union":
        return value.options.map((option) => type(option, hint)).join(" | ");
      case "object": {
        const body = value.fields
          .map(
            (field) =>
              `  ${key(field)}${field.optional ? "?" : ""}: ${type(field.type, pascalCase(field.name))};`,
          )
          .join("\n");
        declarations.push(`interface ${hint} {\n${body}\n}`);
        return hint;
      }
    }
  }

  const rootType = type(root, name);
  // The root's own declaration is printed last so the file reads top-down.
  if (rootType !== name) declarations.push(`type ${name} = ${rootType};`);
  return declarations.reverse().join("\n\n");
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
        return "z.null()";
      case "unknown":
        return "z.unknown()";
      case "array":
        return `z.array(${schema(value.items, indent)})`;
      case "union":
        return `z.union([${value.options.map((o) => schema(o, indent)).join(", ")}])`;
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

function printGo(root: Inferred, name: string): string {
  const declarations: string[] = [];

  function type(value: Inferred, hint: string): string {
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
        return `[]${type(value.items, singular(hint))}`;
      case "union":
        // Go has no sum type; `any` is the honest answer rather than picking
        // one of the observed types and hoping.
        return "any";
      case "object": {
        const body = value.fields
          .map((field) => {
            const goType = type(field.type, pascalCase(field.name));
            // A pointer for anything optional, so "absent" and "zero value"
            // stay distinguishable — the reason Go structs get this wrong.
            const pointer =
              field.optional && !goType.startsWith("[]") ? "*" : "";
            const omit = field.optional ? ",omitempty" : "";
            return `\t${pascalCase(field.name)} ${pointer}${goType} \`json:"${field.name}${omit}"\``;
          })
          .join("\n");
        declarations.push(`type ${hint} struct {\n${body}\n}`);
        return hint;
      }
    }
  }

  const rootType = type(root, name);
  if (rootType !== name) declarations.push(`type ${name} = ${rootType}`);
  return declarations.reverse().join("\n\n");
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

/** "Users" → "User", so an array's element type gets a sensible name. */
function singular(name: string): string {
  if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return `${name}Item`;
}
