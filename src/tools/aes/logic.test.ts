import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./logic";

describe("AES-GCM", () => {
  it("round-trips Turkish text", async () => {
    const blob = await encrypt("Şükrü'nün notu 👋", "parola");
    expect(await decrypt(blob, "parola")).toBe("Şükrü'nün notu 👋");
  });

  it("produces different output each time, because salt and iv are random", async () => {
    const a = await encrypt("same", "parola");
    const b = await encrypt("same", "parola");
    expect(a).not.toBe(b);
    expect(await decrypt(b, "parola")).toBe("same");
  });

  it("fails on the wrong passphrase rather than returning noise", async () => {
    const blob = await encrypt("secret", "right");
    await expect(decrypt(blob, "wrong")).rejects.toThrow();
  });

  it("fails when the ciphertext has been altered", async () => {
    const blob = await encrypt("secret", "parola");
    const tampered =
      blob.slice(0, -4) + (blob.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
    await expect(decrypt(tampered, "parola")).rejects.toThrow();
  });

  it("refuses to work without a passphrase", async () => {
    await expect(encrypt("x", "")).rejects.toThrow();
    await expect(decrypt("AAAA", "")).rejects.toThrow();
  });

  it("rejects a blob that is too short to contain salt and iv", async () => {
    await expect(decrypt("AAAA", "parola")).rejects.toThrow();
  });
});
