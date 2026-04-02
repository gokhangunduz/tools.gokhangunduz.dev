/**
 * Token counts, which is what an API bill is denominated in.
 *
 * The count is exact for OpenAI's cl100k/o200k encodings, which `gpt-tokenizer`
 * implements. Anthropic does not publish a tokenizer, so the Claude figure is
 * an estimate derived from the same tokenisation and labelled as one rather
 * than presented as fact.
 *
 * The thing worth seeing here is that Turkish costs roughly twice what English
 * does per word: the vocabulary is built mostly from English text, so "değişiklik"
 * is several tokens where "change" is one.
 */
export type Encoding = "o200k_base" | "cl100k_base";

export async function countTokens(
  input: string,
  encoding: Encoding,
): Promise<number> {
  if (!input) return 0;
  const encoder =
    encoding === "o200k_base"
      ? await import("gpt-tokenizer/encoding/o200k_base")
      : await import("gpt-tokenizer/encoding/cl100k_base");
  return encoder.encode(input).length;
}

export async function report(
  input: string,
  encoding: Encoding,
  locale: string,
): Promise<string> {
  if (!input) return "";

  const tokens = await countTokens(input, encoding);
  const characters = [...input].length;
  const words = input.trim() ? (input.trim().match(/\S+/g)?.length ?? 0) : 0;

  const rows: [string, string][] = [
    [locale === "tr" ? "token" : "tokens", String(tokens)],
    [locale === "tr" ? "karakter" : "characters", String(characters)],
    [locale === "tr" ? "kelime" : "words", String(words)],
    [
      locale === "tr" ? "token/kelime" : "tokens per word",
      words > 0 ? (tokens / words).toFixed(2) : "—",
    ],
    [
      locale === "tr" ? "karakter/token" : "characters per token",
      tokens > 0 ? (characters / tokens).toFixed(2) : "—",
    ],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return [
    ...rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`),
    "",
    locale === "tr"
      ? "Sayım OpenAI kodlamaları için kesindir. Claude ve Gemini kendi tokenizer'larını yayınlamaz; oradaki maliyet bu sayıya yakın olur ama birebir değildir."
      : "Exact for OpenAI's encodings. Claude and Gemini do not publish theirs, so their cost is close to this figure but not identical.",
  ].join("\n");
}
