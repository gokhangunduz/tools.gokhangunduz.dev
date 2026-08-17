import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import {
  formatOf,
  hasAlpha,
  isHeic,
  parseColor,
  parseLimit,
  resultNote,
  targetSize,
  unsupportedFormat,
} from "./logic";

describe("formatOf", () => {
  it("names known formats", () => {
    expect(formatOf("image/jpeg")).toMatchObject({
      name: "JPEG",
      extension: "jpg",
    });
    expect(formatOf("image/avif").name).toBe("AVIF");
  });

  it("falls back to the subtype", () => {
    expect(formatOf("image/svg+xml").name).toBe("SVG");
  });
});

describe("isHeic", () => {
  it("knows HEIC by type or name", () => {
    expect(isHeic({ name: "IMG_1.HEIC", type: "" })).toBe(true);
    expect(isHeic({ name: "a", type: "image/heif" })).toBe(true);
    expect(isHeic({ name: "a.jpg", type: "image/jpeg" })).toBe(false);
  });
});

describe("targetSize", () => {
  it("caps the width", () => {
    expect(targetSize(4000, 3000, 1600, "width")).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("caps the long edge of a portrait image", () => {
    expect(targetSize(3000, 4000, 1600, "edge")).toEqual({
      width: 1200,
      height: 1600,
    });
    expect(targetSize(3000, 4000, 1600, "width")).toEqual({
      width: 1600,
      height: 2133,
    });
  });

  it("never upscales", () => {
    expect(targetSize(800, 600, 1600, "edge")).toEqual({
      width: 800,
      height: 600,
    });
    expect(targetSize(800, 600, null, "width")).toEqual({
      width: 800,
      height: 600,
    });
  });
});

describe("parseLimit", () => {
  it("accepts empty, digits and px", () => {
    expect(parseLimit("")).toBeNull();
    expect(parseLimit(" 1024 ")).toBe(1024);
    expect(parseLimit("640px")).toBe(640);
  });

  it("rejects anything else and names the field", () => {
    for (const value of ["-5", "0", "12.5", "abc"]) {
      try {
        parseLimit(value);
        throw new Error("no throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ToolError);
        expect((error as ToolError).field).toBe("limit");
      }
    }
  });
});

describe("parseColor", () => {
  it("normalises hex", () => {
    expect(parseColor("#FFF")).toBe("#ffffff");
    expect(parseColor("0a0a0a")).toBe("#0a0a0a");
  });

  it("rejects names", () => {
    expect(() => parseColor("white")).toThrow(ToolError);
  });
});

describe("hasAlpha", () => {
  it("finds a transparent pixel", () => {
    expect(hasAlpha([0, 0, 0, 255, 1, 1, 1, 255])).toBe(false);
    expect(hasAlpha([0, 0, 0, 255, 1, 1, 1, 128])).toBe(true);
  });
});

describe("resultNote", () => {
  it("explains PNG and a JPEG fill in both languages", () => {
    const png = resultNote({
      format: formatOf("image/png"),
      width: 10,
      height: 5,
      filled: null,
    });
    expect(png.tr).toBe("10×5 · PNG · PNG kayıpsızdır; kalite ayarı yok");
    expect(png.en).toContain("lossless");
    const jpeg = resultNote({
      format: formatOf("image/jpeg"),
      width: 1,
      height: 1,
      filled: "#ffffff",
    });
    expect(jpeg.en).toContain("#ffffff");
    expect(jpeg.tr).toContain("#ffffff");
  });

  it("errors name the format, not the MIME type", () => {
    const error = unsupportedFormat(formatOf("image/avif"));
    expect(error.localized.tr).toContain("AVIF");
    expect(error.localized.en).not.toContain("image/");
  });
});
