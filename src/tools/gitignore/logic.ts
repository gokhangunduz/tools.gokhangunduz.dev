import { ToolError } from "../text-tool";

/**
 * A .gitignore assembled from the stacks actually in the project.
 *
 * The generated files people copy are thousands of lines covering every
 * editor and every language; this keeps the sections asked for, each labelled,
 * so the result is a file someone can read and edit afterwards.
 */
const TEMPLATES: Record<string, string[]> = {
  node: [
    "node_modules/",
    "npm-debug.log*",
    "yarn-error.log*",
    ".pnpm-debug.log*",
    ".npm/",
    "*.tsbuildinfo",
  ],
  next: [".next/", "out/", "next-env.d.ts", ".vercel/"],
  vite: ["dist/", "dist-ssr/", "*.local", ".vite/"],
  python: [
    "__pycache__/",
    "*.py[cod]",
    ".venv/",
    "venv/",
    ".pytest_cache/",
    ".mypy_cache/",
    ".ruff_cache/",
    "*.egg-info/",
  ],
  go: ["bin/", "*.exe", "*.test", "*.out", "vendor/"],
  rust: ["target/", "**/*.rs.bk", "Cargo.lock.orig"],
  java: ["target/", "build/", "*.class", "*.jar", ".gradle/"],
  php: ["vendor/", "composer.phar", ".phpunit.result.cache"],
  dotnet: ["bin/", "obj/", "*.user", "*.suo"],
  docker: [".docker/", "docker-compose.override.yml"],
  terraform: [".terraform/", "*.tfstate", "*.tfstate.*", "*.tfvars"],
  env: [".env", ".env.local", ".env.*.local", "*.pem", "*.key"],
  macos: [".DS_Store", ".AppleDouble", "._*", ".Spotlight-V100", ".Trashes"],
  windows: ["Thumbs.db", "ehthumbs.db", "Desktop.ini", "$RECYCLE.BIN/"],
  linux: ["*~", ".directory", ".Trash-*"],
  vscode: [".vscode/*", "!.vscode/extensions.json", "!.vscode/settings.json"],
  jetbrains: [".idea/", "*.iml", "*.iws"],
  logs: ["logs/", "*.log"],
  coverage: ["coverage/", ".nyc_output/", "*.lcov"],
};

export const AVAILABLE = Object.keys(TEMPLATES);

const HEADINGS: Record<string, string> = {
  node: "Node",
  next: "Next.js",
  vite: "Vite",
  python: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java / Gradle",
  php: "PHP",
  dotnet: ".NET",
  docker: "Docker",
  terraform: "Terraform",
  env: "Secrets and local config",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  vscode: "VS Code",
  jetbrains: "JetBrains",
  logs: "Logs",
  coverage: "Coverage",
};

export function build(input: string): string {
  const names = input
    .split(/[,\s]+/)
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (names.length === 0) {
    throw new ToolError({
      tr: `En az bir b\u00f6l\u00fcm se\u00e7: ${AVAILABLE.join(", ")}`,
      en: `Name at least one section: ${AVAILABLE.join(", ")}`,
    });
  }

  const unknown = names.filter((name) => !(name in TEMPLATES));
  if (unknown.length > 0) {
    throw new ToolError({
      tr: `Bilinmeyen b\u00f6l\u00fcm: ${unknown.join(", ")}. Kullan\u0131labilir: ${AVAILABLE.join(", ")}`,
      en: `Unknown section: ${unknown.join(", ")}. Available: ${AVAILABLE.join(", ")}`,
    });
  }

  const seen = new Set<string>();
  const blocks: string[] = [];

  for (const name of names) {
    // A pattern already covered by an earlier section is dropped rather than
    // repeated: `target/` belongs to both Rust and Java.
    const lines = TEMPLATES[name].filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
    if (lines.length > 0) {
      blocks.push([`# ${HEADINGS[name]}`, ...lines].join("\n"));
    }
  }

  return blocks.join("\n\n") + "\n";
}
