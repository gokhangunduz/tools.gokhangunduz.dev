import { describe, expect, it } from "vitest";
import { acceptLabel, chooseFile, statsHeadline } from "./file-tool";
import { ToolError } from "./text-tool";

const png = { name: "photo.png", type: "image/png" };
const txt = { name: "notes.txt", type: "text/plain" };
const svg = { name: "logo.svg", type: "image/svg+xml" };

describe("acceptLabel", () => {
  it("names a whole family", () => {
    expect(acceptLabel("image/*")).toEqual({
      tr: "her görsel biçimi",
      en: "any image format",
    });
  });

  it("names extensions and MIME types once each", () => {
    expect(acceptLabel(".svg, image/svg+xml, image/png").en).toBe("SVG, PNG");
  });

  it("falls back to any file for an empty list", () => {
    expect(acceptLabel("").tr).toBe("her dosya");
  });
});

describe("chooseFile", () => {
  it("takes the first accepted file and counts the rest", () => {
    expect(chooseFile([txt, png, svg], "image/*")).toEqual({
      file: png,
      ignored: 2,
    });
  });

  it("takes a single match with nothing ignored", () => {
    expect(chooseFile([svg], ".svg")).toEqual({ file: svg, ignored: 0 });
  });

  it("rejects files the tool does not accept, in both languages", () => {
    try {
      chooseFile([txt], "image/*");
      expect.unreachable();
    } catch (cause) {
      expect(cause).toBeInstanceOf(ToolError);
      const { localized } = cause as ToolError;
      expect(localized.tr).toContain("notes.txt");
      expect(localized.tr).toContain("her görsel biçimi");
      expect(localized.en).toContain("any image format");
    }
  });
});

describe("statsHeadline", () => {
  it("shows a saving as success", () => {
    expect(statsHeadline({ before: 2048, after: 512 })).toEqual({
      text: { tr: "512 B · −%75", en: "512 B · −75%" },
      tone: "success",
    });
  });

  it("shows growth as destructive", () => {
    const { text, tone } = statsHeadline({ before: 1000, after: 1500 });
    expect(text.en).toBe("1.5 KB · +50%");
    expect(tone).toBe("destructive");
  });

  it("stays neutral when nothing changed or there is nothing to compare", () => {
    expect(statsHeadline({ before: 100, after: 100 }).tone).toBe("muted");
    expect(statsHeadline({ before: 0, after: 100 }).text.en).toBe("100 B");
  });
});
