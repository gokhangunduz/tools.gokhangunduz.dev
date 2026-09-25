import { ToolError } from "../text-tool";

/**
 * The shields.io badges a README actually carries, in Markdown and HTML.
 *
 * Written from a repository path rather than assembled by hand, because the
 * URL encoding is where these go wrong: a hyphen in a label has to be doubled,
 * and a space becomes an underscore.
 */
export type Style = "flat" | "flat-square" | "for-the-badge" | "plastic";

export type Options = {
  repo: string;
  style: Style;
  format: "markdown" | "html";
  extra: string;
};

type Badge = { label: string; url: string; link: string };

export function build(options: Options): string {
  const repo = options.repo
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\/$/, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new ToolError({
      tr: "Depo \u201ckullan\u0131c\u0131/proje\u201d bi\u00e7iminde yaz\u0131lmal\u0131.",
      en: "Write the repository as \u201cowner/name\u201d.",
    });
  }

  const query = `?style=${options.style}`;
  const link = `https://github.com/${repo}`;

  const badges: Badge[] = [
    {
      label: "CI",
      url: `https://img.shields.io/github/actions/workflow/status/${repo}/ci.yml${query}`,
      link: `${link}/actions`,
    },
    {
      label: "Coverage",
      url: `https://img.shields.io/codecov/c/github/${repo}${query}`,
      link: `https://codecov.io/gh/${repo}`,
    },
    {
      label: "License",
      url: `https://img.shields.io/github/license/${repo}${query}`,
      link: `${link}/blob/main/LICENSE`,
    },
    {
      label: "Version",
      url: `https://img.shields.io/github/v/release/${repo}${query}`,
      link: `${link}/releases`,
    },
    {
      label: "Issues",
      url: `https://img.shields.io/github/issues/${repo}${query}`,
      link: `${link}/issues`,
    },
    {
      label: "Stars",
      url: `https://img.shields.io/github/stars/${repo}${query}`,
      link: `${link}/stargazers`,
    },
  ];

  for (const entry of options.extra
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)) {
    const [label, message = "", color = "blue"] = entry
      .split(":")
      .map((part) => part.trim());
    badges.push({
      label,
      url: `https://img.shields.io/badge/${escape(label)}-${escape(message)}-${color}${query}`,
      link,
    });
  }

  return badges
    .map((badge) =>
      options.format === "html"
        ? `<a href="${badge.link}"><img src="${badge.url}" alt="${badge.label}"></a>`
        : `[![${badge.label}](${badge.url})](${badge.link})`,
    )
    .join(options.format === "html" ? "\n" : "\n");
}

/** shields.io escaping: a hyphen is doubled, a space becomes an underscore. */
function escape(value: string): string {
  return encodeURIComponent(value.replace(/-/g, "--").replace(/ /g, "_"));
}
