import { describe, expect, it } from "vitest";
import {
  acceptsFile,
  downloadName,
  measureText,
  offsetAt,
  positionAt,
  resolvePerValues,
  restoreValues,
  shareableValues,
  toTextResult,
  ToolError,
  visibleOptions,
  type ToolOption,
} from "./text-tool";

describe("measureText", () => {
  it("counts code points, UTF-8 bytes and lines", () => {
    expect(measureText("Merhaba dünya 👋")).toEqual({
      chars: 15,
      bytes: 19,
      lines: 1,
    });
    expect(measureText("a\nb\n")).toEqual({ chars: 4, bytes: 4, lines: 3 });
    expect(measureText("")).toEqual({ chars: 0, bytes: 0, lines: 0 });
  });
});

describe("downloadName", () => {
  it("keeps the dropped file's base name", () => {
    expect(
      downloadName({
        fallback: "svg-optimize",
        source: "icon.svg",
        extension: "min.svg",
      }),
    ).toBe("icon.min.svg");
    expect(
      downloadName({
        fallback: "minify",
        source: "app.bundle.js",
        extension: "min.js",
      }),
    ).toBe("app.bundle.min.js");
  });

  it("falls back to the tool id", () => {
    expect(downloadName({ fallback: "json-yaml", extension: "yaml" })).toBe(
      "json-yaml.yaml",
    );
    expect(
      downloadName({ fallback: "minify", source: ".js", extension: "min.js" }),
    ).toBe("minify.min.js");
  });
});

describe("acceptsFile", () => {
  it("matches extensions and MIME types, ignoring case", () => {
    expect(acceptsFile({ name: "Logo.SVG", type: "" }, ".svg")).toBe(true);
    expect(acceptsFile({ name: "app.css", type: "text/css" }, ".js,.css")).toBe(
      true,
    );
    expect(acceptsFile({ name: "a.txt", type: "text/plain" }, "text/*")).toBe(
      true,
    );
    expect(acceptsFile({ name: "photo.png", type: "image/png" }, ".svg")).toBe(
      false,
    );
  });
});

describe("toTextResult / resolvePerValues", () => {
  it("wraps plain strings and resolves option-dependent settings", () => {
    expect(toTextResult("x")).toEqual({ text: "x" });
    const rows = { text: "a", rows: [{ label: "k", value: "v" }] };
    expect(toTextResult(rows)).toBe(rows);
    expect(resolvePerValues(true, {})).toBe(true);
    expect(resolvePerValues((o) => o.lang === "css", { lang: "css" })).toBe(
      true,
    );
  });
});

describe("positions", () => {
  it("converts between offsets and 1-based lines and columns", () => {
    const text = "ab\ncd\n\nef";
    expect(positionAt(text, 0)).toEqual({ line: 1, column: 1 });
    expect(positionAt(text, 3)).toEqual({ line: 2, column: 1 });
    expect(positionAt(text, 5)).toEqual({ line: 2, column: 3 });
    expect(positionAt(text, 7)).toEqual({ line: 4, column: 1 });
    for (const offset of [0, 1, 3, 5, 6, 7, 9]) {
      expect(offsetAt(text, positionAt(text, offset))).toBe(offset);
    }
    expect(offsetAt(text, { line: 9, column: 9 })).toBe(9);
    expect(offsetAt(text, { line: 1, column: 40 })).toBe(2);
  });

  it("appends the position to a ToolError and keeps the bare detail", () => {
    const error = new ToolError(
      { tr: "hata", en: "oops" },
      { at: { line: 2, column: 5 }, field: "key" },
    );
    expect(error.localized).toEqual({
      tr: "hata (satır 2, sütun 5)",
      en: "oops (line 2, column 5)",
    });
    expect(error.detail).toEqual({ tr: "hata", en: "oops" });
    expect(error.field).toBe("key");
    expect(new ToolError({ tr: "a", en: "b" }).localized).toEqual({
      tr: "a",
      en: "b",
    });
  });
});

describe("options", () => {
  const options: ToolOption[] = [
    {
      kind: "switch",
      id: "urlsafe",
      label: { tr: "", en: "" },
      default: false,
      directions: ["encode"],
    },
    {
      kind: "select",
      id: "format",
      label: { tr: "", en: "" },
      default: "png",
      choices: [
        { value: "png", label: { tr: "", en: "" } },
        { value: "jpeg", label: { tr: "", en: "" } },
      ],
    },
    {
      kind: "text",
      id: "quality",
      label: { tr: "", en: "" },
      default: "90",
      visibleWhen: (values) => values.format !== "png",
    },
    {
      kind: "text",
      id: "key",
      label: { tr: "", en: "" },
      default: "",
      secret: true,
    },
  ];
  const ids = (list: ToolOption[]) => list.map((o) => o.id);

  it("scopes options to a direction and to other values", () => {
    const png = { urlsafe: false, format: "png", quality: "90", key: "" };
    expect(ids(visibleOptions(options, png, "encode"))).toEqual([
      "urlsafe",
      "format",
      "key",
    ]);
    expect(ids(visibleOptions(options, png, "decode"))).toEqual([
      "format",
      "key",
    ]);
    expect(
      ids(visibleOptions(options, { ...png, format: "jpeg" }, "decode")),
    ).toEqual(["format", "quality", "key"]);
    expect(ids(visibleOptions(options, png))).toEqual([
      "urlsafe",
      "format",
      "key",
    ]);
  });

  it("shares only changed, non-secret values and restores only valid ones", () => {
    const values = {
      urlsafe: true,
      format: "png",
      quality: "80",
      key: "hunter2",
    };
    expect(shareableValues(options, values)).toEqual({
      urlsafe: true,
      quality: "80",
    });
    expect(
      restoreValues(options, {
        urlsafe: "yes",
        format: "gif",
        quality: "70",
        key: "leaked",
        other: 1,
      }),
    ).toEqual({ urlsafe: false, format: "png", quality: "70", key: "" });
    expect(restoreValues(options, { format: "jpeg" }).format).toBe("jpeg");
  });
});
