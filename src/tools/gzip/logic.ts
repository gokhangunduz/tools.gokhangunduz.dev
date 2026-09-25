import {
  base64ToBytes,
  bytesToBase64,
  bytesToText,
  textToBytes,
} from "@/lib/bytes";
import { ToolError } from "../text-tool";

/**
 * Compression through the platform's own streams.
 *
 * `CompressionStream` is in every current browser and in Node, so this needs
 * no library at all — which matters for a tool whose whole job is to make
 * something smaller. The compressed bytes are printed as Base64 because the
 * output box holds text.
 */
export type Format = "gzip" | "deflate" | "deflate-raw";

async function run(
  bytes: Uint8Array,
  stream: TransformStream,
): Promise<Uint8Array> {
  const response = new Response(
    new Blob([bytes as BlobPart]).stream().pipeThrough(stream),
  );
  return new Uint8Array(await response.arrayBuffer());
}

export async function compress(input: string, format: Format): Promise<string> {
  if (!input) return "";
  const bytes = await run(textToBytes(input), new CompressionStream(format));
  return bytesToBase64(bytes);
}

export async function decompress(
  input: string,
  format: Format,
): Promise<string> {
  if (!input.trim()) return "";

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(input);
  } catch {
    throw new ToolError({
      tr: "Girdi geçerli bir Base64 değeri değil.",
      en: "The input is not valid Base64.",
    });
  }

  let out: Uint8Array;
  try {
    out = await run(bytes, new DecompressionStream(format));
  } catch {
    throw new ToolError({
      tr: "Bu veri seçilen biçimde sıkıştırılmış görünmüyor.",
      en: "This data does not look compressed in the selected format.",
    });
  }

  try {
    return bytesToText(out);
  } catch {
    throw new ToolError({
      tr: "Açılan veri metin değil (ikili dosya olabilir).",
      en: "The decompressed data is not text (it may be a binary file).",
    });
  }
}

/** What the tool is actually for: is this worth compressing at all? */
export function ratioLine(input: string, output: string): string {
  const before = textToBytes(input).length;
  const after = base64ToBytes(output).length;
  const percent = before === 0 ? 0 : Math.round((1 - after / before) * 100);
  return `${before} B → ${after} B (${percent >= 0 ? "-" : "+"}${Math.abs(percent)}%)`;
}
