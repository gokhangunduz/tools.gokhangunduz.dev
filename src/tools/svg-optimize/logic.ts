import { ToolError } from "../text-tool";

/**
 * SVGO, in the page.
 *
 * Exported SVGs carry an editor's metadata, unused ids and coordinates at
 * fifteen decimal places; the plugin defaults clean all of that. `cleanupIds`
 * is off by default because an icon sprite depends on its ids, and an
 * optimiser that silently breaks `<use href="#icon">` is worse than one that
 * saves a few bytes less.
 */
export type Options = {
  precision: number;
  removeIds: boolean;
  removeDimensions: boolean;
};

export async function optimizeSvg(
  input: string,
  options: Options,
): Promise<string> {
  const source = input.trim();
  if (!source) return "";
  if (!source.includes("<svg")) {
    throw new ToolError({
      tr: "Girdide <svg> öğesi yok.",
      en: "There is no <svg> element in the input.",
    });
  }

  // The browser build: the default entry pulls in `fs/promises` for reading
  // a config file, which has no meaning here and breaks the bundle.
  const { optimize } = await import("svgo/browser");

  try {
    const result = optimize(source, {
      multipass: true,
      floatPrecision: options.precision,
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              cleanupIds: options.removeIds ? {} : false,
              // Keeping the viewBox is what lets the icon scale; removing it
              // is the single most common way an optimised SVG breaks.
              removeViewBox: false,
            },
          },
        },
        ...(options.removeDimensions
          ? [{ name: "removeDimensions" as const }]
          : []),
      ],
    });
    return result.data;
  } catch (cause) {
    throw new ToolError({
      tr: `SVG işlenemedi: ${cause instanceof Error ? cause.message.split("\n")[0] : ""}`,
      en: `Could not process the SVG: ${cause instanceof Error ? cause.message.split("\n")[0] : ""}`,
    });
  }
}

export function savingLine(input: string, output: string): string {
  const before = new TextEncoder().encode(input.trim()).length;
  const after = new TextEncoder().encode(output).length;
  const percent = before === 0 ? 0 : Math.round((1 - after / before) * 100);
  return `${before} B → ${after} B (-${Math.max(percent, 0)}%)`;
}
