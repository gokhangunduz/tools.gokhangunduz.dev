import { describe, expect, it } from "vitest";
import { binaryToText, textToBinary } from "./logic";

describe("textToBinary", () => {
  it("writes eight bits per byte", () => {
    expect(textToBinary("A", true)).toBe("01000001");
  });

  it("uses UTF-8 bytes for non-ASCII", () => {
    expect(textToBinary("ç", true)).toBe("11000011 10100111");
  });

  it("can run the bits together", () => {
    expect(textToBinary("AB", false)).toBe("0100000101000010");
  });
});

describe("binaryToText", () => {
  it("round-trips Turkish text", () => {
    expect(binaryToText(textToBinary("Şükrü", true))).toBe("Şükrü");
  });

  it("rejects a bit count that is not a multiple of eight", () => {
    expect(() => binaryToText("0100 001")).toThrow();
  });

  it("rejects anything that is not a bit", () => {
    expect(() => binaryToText("01201001")).toThrow();
  });
});
