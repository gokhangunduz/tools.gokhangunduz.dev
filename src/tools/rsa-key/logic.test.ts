import { describe, expect, it } from "vitest";
import { generateKeyPair } from "./logic";

describe("generateKeyPair", () => {
  it("writes both keys as PEM", async () => {
    const output = await generateKeyPair("EC-P256");
    expect(output).toContain("-----BEGIN PUBLIC KEY-----");
    expect(output).toContain("-----END PUBLIC KEY-----");
    expect(output).toContain("-----BEGIN PRIVATE KEY-----");
    expect(output).toContain("-----END PRIVATE KEY-----");
  });

  it("wraps the base64 at 64 characters, as PEM requires", async () => {
    const output = await generateKeyPair("EC-P256");
    const body = output
      .split("\n")
      .filter((line) => !line.startsWith("-----") && line !== "");
    for (const line of body) expect(line.length).toBeLessThanOrEqual(64);
  });

  it("produces a key that can be imported back", async () => {
    const output = await generateKeyPair("EC-P256");
    const pem = output.slice(
      output.indexOf("-----BEGIN PUBLIC KEY-----"),
      output.indexOf("-----END PUBLIC KEY-----") + 24,
    );
    const base64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    await expect(
      crypto.subtle.importKey(
        "spki",
        bytes,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"],
      ),
    ).resolves.toBeDefined();
  });

  it("produces a different pair each time", async () => {
    const [a, b] = await Promise.all([
      generateKeyPair("EC-P256"),
      generateKeyPair("EC-P256"),
    ]);
    expect(a).not.toBe(b);
  });

  it("supports RSA as well", async () => {
    const output = await generateKeyPair("RSA-2048");
    expect(output).toContain("PRIVATE KEY");
  }, 30_000);
});
