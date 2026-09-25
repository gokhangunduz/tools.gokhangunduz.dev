import { ToolError } from "../text-tool";

/**
 * Making things smaller, per language, with a real minifier each.
 *
 * The first version of this collapsed Prettier's output with a regex, and the
 * test caught it turning `"a: b, c"` inside a string literal into `"a:b,c"`.
 * Anything that rewrites code without parsing it has that bug somewhere, so
 * each language goes through a tool that understands it: JSON through the
 * platform's own round-trip, JavaScript through terser, CSS through csso.
 *
 * HTML is deliberately absent. Every browser-capable HTML minifier either
 * collapses whitespace that is significant inside `pre` and inline elements or
 * drags in a Node-only dependency, and a minifier that silently changes what
 * renders is worse than not having one.
 */
export type MinifyLanguage = "json" | "javascript" | "css";

export async function minify(
  input: string,
  language: MinifyLanguage,
): Promise<string> {
  if (!input.trim()) return "";

  if (language === "json") {
    try {
      return JSON.stringify(JSON.parse(input));
    } catch (cause) {
      throw new ToolError({
        tr: `Geçersiz JSON: ${cause instanceof Error ? cause.message : ""}`,
        en: `Invalid JSON: ${cause instanceof Error ? cause.message : ""}`,
      });
    }
  }

  if (language === "css") {
    // csso never throws: css-tree recovers from a broken rule by dropping it,
    // so a stylesheet with a typo minifies to a stylesheet missing a rule. The
    // parse is run separately first for the errors, which is the only way to
    // tell the user their file is broken rather than silently shrinking it.
    const csstree = await import("css-tree");
    const errors: { message: string; line?: number }[] = [];
    csstree.parse(input, {
      positions: true,
      onParseError: (error: { message: string; line?: number }) =>
        errors.push(error),
    });
    if (errors.length > 0) {
      const { message, line } = errors[0];
      throw new ToolError({
        tr: `CSS geçersiz${line ? ` (satır ${line})` : ""}: ${message}`,
        en: `Invalid CSS${line ? ` (line ${line})` : ""}: ${message}`,
      });
    }

    const { minify: minifyCss } = await import("csso");
    const css = minifyCss(input).css;
    if (!css) {
      // css-tree tolerates an unterminated declaration like `a { color:` — it
      // reports no error and csso then drops the empty rule, leaving nothing.
      throw new ToolError({
        tr: "Girdide geçerli bir CSS kuralı bulunamadı.",
        en: "No valid CSS rule was found in the input.",
      });
    }
    return css;
  }

  const { minify: minifyJs } = await import("terser");
  let result;
  try {
    result = await minifyJs(input, {
      // Names are left alone: the output is usually going to be read or
      // compared against the input, not shipped, and mangled identifiers make
      // that impossible. Size still drops by most of what mangling would give.
      mangle: false,
      format: { comments: false },
    });
  } catch (cause) {
    throw new ToolError({
      tr: `JavaScript ayrıştırılamadı: ${firstLine(cause)}`,
      en: `Could not parse the JavaScript: ${firstLine(cause)}`,
    });
  }

  return result.code ?? "";
}

function firstLine(cause: unknown): string {
  return cause instanceof Error ? cause.message.split("\n")[0] : "";
}

/** The number people actually want out of a minifier. */
export function savingLine(input: string, output: string): string {
  const before = new TextEncoder().encode(input).length;
  const after = new TextEncoder().encode(output).length;
  const percent = before === 0 ? 0 : Math.round((1 - after / before) * 100);
  return `${before} B → ${after} B (-${Math.max(percent, 0)}%)`;
}
