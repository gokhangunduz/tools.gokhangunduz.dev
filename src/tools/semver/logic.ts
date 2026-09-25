import type { ReleaseType } from "semver";
import { ToolError } from "../text-tool";

/**
 * Semantic version questions, answered per line.
 *
 * Two things are asked of a version in practice: what it parses as, and
 * whether it satisfies a range. Both are here because the second is the one
 * people get wrong — `^0.2.3` does not allow 0.3.0, and the caret behaving
 * differently below 1.0.0 is the reason a lockfile surprises someone.
 */
export type Mode = "parse" | "satisfies" | "sort" | "increment";

export async function run(
  input: string,
  mode: Mode,
  range: string,
  release: string,
): Promise<string> {
  if (!input.trim()) return "";

  const semver = await import("semver");
  const lines = input
    .split(/[\s,]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (mode === "sort") {
    const invalid = lines.filter(
      (line) => !semver.valid(semver.coerce(line) ?? ""),
    );
    if (invalid.length > 0) {
      throw new ToolError({
        tr: `Sürüm olarak okunamadı: ${invalid.join(", ")}`,
        en: `Not readable as versions: ${invalid.join(", ")}`,
      });
    }
    return semver.rsort(lines.slice()).join("\n");
  }

  if (mode === "satisfies") {
    if (!range.trim()) {
      throw new ToolError({
        tr: "Karşılaştırılacak aralık girilmedi (örn. ^1.2.0).",
        en: "No range to check against (e.g. ^1.2.0).",
      });
    }
    if (!semver.validRange(range)) {
      throw new ToolError({
        tr: `Geçersiz aralık: ${range}`,
        en: `Invalid range: ${range}`,
      });
    }
    const width = Math.max(...lines.map((line) => line.length));
    return lines
      .map((version) => {
        if (!semver.valid(version)) {
          return `${version.padEnd(width)}  ?  ${"geçersiz sürüm / invalid version"}`;
        }
        const ok = semver.satisfies(version, range);
        return `${version.padEnd(width)}  ${ok ? "✓" : "✗"}  ${range}`;
      })
      .join("\n");
  }

  if (mode === "increment") {
    const width = Math.max(...lines.map((line) => line.length));
    return lines
      .map((version) => {
        const next = semver.inc(version, release as ReleaseType);
        if (!next) {
          throw new ToolError({
            tr: `Artırılamadı: ${version}`,
            en: `Could not increment: ${version}`,
          });
        }
        return `${version.padEnd(width)}  →  ${next}`;
      })
      .join("\n");
  }

  return lines
    .map((version) => {
      const parsed = semver.parse(version);
      if (!parsed) {
        const coerced = semver.coerce(version);
        return coerced
          ? `${version}\n  ${"geçersiz; en yakın okuma / invalid; closest reading"}: ${coerced.version}`
          : `${version}\n  ${"sürüm olarak okunamadı / not readable as a version"}`;
      }
      const rows = [
        `major        ${parsed.major}`,
        `minor        ${parsed.minor}`,
        `patch        ${parsed.patch}`,
        `prerelease   ${parsed.prerelease.join(".") || "—"}`,
        `build        ${parsed.build.join(".") || "—"}`,
        `^${parsed.version}      ${caretRange(parsed.major, parsed.minor)}`,
        `~${parsed.version}      ${tildeRange(parsed.major, parsed.minor)}`,
      ];
      return `${parsed.version}\n${rows.map((row) => `  ${row}`).join("\n")}`;
    })
    .join("\n\n");
}

/** Spelled out because the caret's behaviour below 1.0.0 is the trap. */
function caretRange(major: number, minor: number): string {
  if (major > 0) return `>=${major}.0.0 <${major + 1}.0.0`;
  if (minor > 0) return `>=0.${minor}.0 <0.${minor + 1}.0`;
  return ">=0.0.x <0.0.(x+1)";
}

function tildeRange(major: number, minor: number): string {
  return `>=${major}.${minor}.0 <${major}.${minor + 1}.0`;
}
