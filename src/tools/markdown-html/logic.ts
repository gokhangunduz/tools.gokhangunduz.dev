import { ToolError } from "../text-tool";

/**
 * Markdown to HTML, and a readable-text direction back.
 *
 * `marked` with GFM on, which is the dialect anyone pasting from a README or
 * an issue is actually writing. The output is not sanitized and the tool says
 * so: this is a conversion tool, and silently stripping a `<details>` block
 * someone deliberately wrote would be the wrong kind of helpful.
 */
export async function markdownToHtml(
  input: string,
  breaks: boolean,
): Promise<string> {
  if (!input.trim()) return "";

  const { marked } = await import("marked");
  try {
    return (await marked.parse(input, { gfm: true, breaks })).trim();
  } catch (cause) {
    throw new ToolError({
      tr: `Markdown işlenemedi: ${cause instanceof Error ? cause.message : ""}`,
      en: `Could not render the Markdown: ${cause instanceof Error ? cause.message : ""}`,
    });
  }
}
