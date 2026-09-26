// The invariants a type-checker does not catch, for verify/invariants.sh:
//
//   1. src/i18n/tr.json and en.json have the same keys, and no empty value.
//   2. Every object literal in src/ with a `tr` property has an `en` one and the
//      reverse, and neither side is an empty string while the other is not.
//   3. No colour literal (hex, rgb(), hsl(), oklch()) in UI code — src/components,
//      src/app, and every .tsx/.css — outside src/app/globals.css, except the
//      pairs frozen in verify/allowed-hex.txt. A tool's logic and spec may hold
//      colours as data (the QR code's modules, an image's background).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createRequire } from "node:module";

const ROOT = new URL("..", import.meta.url).pathname;
const require = createRequire(join(ROOT, "package.json"));
const ts = require("typescript");

const problems = [];
const rel = (file) => relative(ROOT, file).split(sep).join("/");

/* 1. shell dictionaries */
function leaves(node, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") leaves(value, path, out);
    else out.set(path, value);
  }
  return out;
}
const dictionaries = Object.fromEntries(
  ["tr", "en"].map((locale) => [
    locale,
    leaves(JSON.parse(readFileSync(join(ROOT, `src/i18n/${locale}.json`), "utf8"))),
  ]),
);
for (const [locale, other] of [["tr", "en"], ["en", "tr"]]) {
  for (const [key, value] of dictionaries[locale]) {
    if (!dictionaries[other].has(key)) problems.push(`src/i18n/${other}.json: missing "${key}" (present in ${locale}.json)`);
    if (typeof value !== "string" || value.trim() === "") problems.push(`src/i18n/${locale}.json: "${key}" is empty or not a string`);
  }
}

/* 2 and 3 walk the sources */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const sources = walk(join(ROOT, "src")).filter(
  (file) => /\.(ts|tsx|css)$/.test(file) && !/\.test\.ts$/.test(file) && !file.endsWith(".d.ts"),
);

const propName = (property) => {
  if (!property.name) return null;
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) return property.name.text;
  return null;
};
const literalText = (node) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;

let localizedPairs = 0;
for (const file of sources.filter((f) => /\.tsx?$/.test(f))) {
  const text = readFileSync(file, "utf8");
  if (!/\b(tr|en)\b/.test(text)) continue;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const props = new Map();
      for (const property of node.properties) {
        const name = propName(property);
        if (name === "tr" || name === "en") props.set(name, property);
      }
      if (props.size) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        const at = `${rel(file)}:${line + 1}`;
        if (props.size === 1) {
          const [only] = props.keys();
          problems.push(`${at}: { ${only}: … } has no ${only === "tr" ? "en" : "tr"}`);
        } else {
          localizedPairs++;
          const tr = ts.isPropertyAssignment(props.get("tr")) ? literalText(props.get("tr").initializer) : null;
          const en = ts.isPropertyAssignment(props.get("en")) ? literalText(props.get("en").initializer) : null;
          if (tr !== null && en !== null && (tr.trim() === "") !== (en.trim() === "")) {
            problems.push(`${at}: ${tr.trim() === "" ? "tr" : "en"} is empty while the other language is not`);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

/* 3. colour literals in UI code */
const allowed = new Set(
  readFileSync(join(ROOT, "verify/allowed-hex.txt"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.replace(/\s+/g, " ").toLowerCase()),
);
const isUi = (path) =>
  path !== "src/app/globals.css" &&
  (path.startsWith("src/components/") || path.startsWith("src/app/") || /\.(tsx|css)$/.test(path));
const COLOUR = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g;
let scanned = 0;
for (const file of sources) {
  const path = rel(file);
  if (!isUi(path)) continue;
  scanned++;
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    for (const match of line.matchAll(COLOUR)) {
      const value = match[0].toLowerCase();
      if (allowed.has(`${path} ${value}`.toLowerCase())) continue;
      problems.push(`${path}:${index + 1}: colour literal ${match[0]} — use a token from src/app/globals.css`);
    }
  });
}

const RED = "\x1b[31m", GREEN = "\x1b[32m", OFF = "\x1b[0m";
if (problems.length) {
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`${RED}✗${OFF} ${problems.length} invariant violation(s) — every string in tr and en, every colour from a token`);
  process.exit(1);
}
console.log(
  `${GREEN}✓${OFF} invariants: ${dictionaries.tr.size} shell keys in both languages, ${localizedPairs} Localized pairs, no colour literal in ${scanned} UI file(s)`,
);
