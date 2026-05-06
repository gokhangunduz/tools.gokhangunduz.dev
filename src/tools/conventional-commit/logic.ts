import { ToolError } from "../text-tool";

/**
 * A Conventional Commit message, checked as it is built.
 *
 * The rules that get broken in practice: the subject is imperative and does
 * not end in a full stop, the header stays under 72 characters, and a
 * breaking change is marked both with `!` and with a footer — tools that
 * generate changelogs read the footer, people read the `!`.
 */
export const TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

export type Type = (typeof TYPES)[number];

export type Input = {
  type: Type;
  scope: string;
  subject: string;
  body: string;
  breaking: string;
  issue: string;
};

const MAX_HEADER = 72;

export function build(input: Input): string {
  const subject = input.subject.trim();
  if (!subject) {
    throw new ToolError({
      tr: "Konu sat\u0131r\u0131 bo\u015f olamaz.",
      en: "The subject cannot be empty.",
    });
  }

  const cleaned = subject.replace(/\.$/, "");
  const scope = input.scope.trim();
  const breaking = input.breaking.trim();

  const header = `${input.type}${scope ? `(${scope})` : ""}${breaking ? "!" : ""}: ${cleaned}`;

  if (header.length > MAX_HEADER) {
    throw new ToolError({
      tr: `Ba\u015fl\u0131k ${header.length} karakter; ${MAX_HEADER} s\u0131n\u0131r\u0131n\u0131 a\u015f\u0131yor.`,
      en: `The header is ${header.length} characters, over the ${MAX_HEADER} limit.`,
    });
  }

  const parts = [header];
  const body = input.body.trim();
  if (body) parts.push("", body);

  const footers: string[] = [];
  if (breaking) footers.push(`BREAKING CHANGE: ${breaking}`);

  const issue = input.issue.trim();
  if (issue) {
    const numbers = issue.match(/\d+/g) ?? [];
    for (const number of numbers) footers.push(`Closes #${number}`);
  }

  if (footers.length > 0) parts.push("", footers.join("\n"));

  return parts.join("\n");
}

/** The advice that would otherwise come from a linter nobody has installed. */
export function review(input: Input, locale: "tr" | "en"): string | null {
  const subject = input.subject.trim();
  if (!subject) return null;

  const notes: string[] = [];
  const first = subject.split(/\s+/)[0]?.toLowerCase() ?? "";

  if (/^[A-Z\u00c7\u011e\u0130\u00d6\u015e\u00dc]/.test(subject)) {
    notes.push(
      locale === "tr"
        ? "konu k\u00fc\u00e7\u00fck harfle ba\u015flar"
        : "the subject starts lowercase",
    );
  }
  if (/(ed|di|d\u0131|du|d\u00fc)$/.test(first) || /(ing)$/.test(first)) {
    notes.push(
      locale === "tr"
        ? "emir kipi kullan\u0131l\u0131r (\u201cekle\u201d, \u201cd\u00fczelt\u201d)"
        : "use the imperative (\u201cadd\u201d, \u201cfix\u201d)",
    );
  }
  if (subject.endsWith(".")) {
    notes.push(
      locale === "tr" ? "sonda nokta olmaz" : "no full stop at the end",
    );
  }

  return notes.length > 0 ? notes.join(" \u00b7 ") : null;
}
