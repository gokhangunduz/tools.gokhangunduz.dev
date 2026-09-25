import { describe, expect, it } from "vitest";
import { hmac } from "./logic";

describe("hmac", () => {
  it("matches RFC 4231's test case 1", async () => {
    // key = 20 bytes of 0x0b, message = "Hi There".
    const key = "\x0b".repeat(20);
    expect(await hmac("Hi There", key, "SHA-256", "hex")).toBe(
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
    );
  });

  it("can print the signature as Base64, as webhook headers do", async () => {
    expect(await hmac("Hi There", "\x0b".repeat(20), "SHA-256", "base64")).toBe(
      "sDRMYdjbOFNcqK/OrwvxK4gdwgDJgz2nJuk3bC4yz/c=",
    );
  });

  it("changes completely with the key", async () => {
    const a = await hmac("m", "k1", "SHA-256", "hex");
    const b = await hmac("m", "k2", "SHA-256", "hex");
    expect(a).not.toBe(b);
  });

  it("refuses an empty key rather than signing with nothing", async () => {
    await expect(hmac("m", "", "SHA-256", "hex")).rejects.toThrow();
  });
});
