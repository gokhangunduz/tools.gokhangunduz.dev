import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { decodeToken, expiryNote, splitToken, verifyToken } from "./logic";

const SECRET = new TextEncoder().encode("a-secret-long-enough-for-hs256-xx");

async function makeToken(claims: Record<string, unknown>, expires: string) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(SECRET);
}

describe("splitToken", () => {
  it("rejects anything that is not three parts", () => {
    expect(() => splitToken("abc")).toThrow();
    expect(() => splitToken("a.b")).toThrow();
  });

  it("rejects a part that is not JSON", () => {
    expect(() => splitToken("aGk.aGk.sig")).toThrow();
  });
});

describe("decodeToken", () => {
  it("reads a token without any key", async () => {
    const token = await makeToken({ sub: "42", role: "admin" }, "2h");
    const output = decodeToken(token, false);
    expect(output).toContain('"HS256"');
    expect(output).toContain('"sub": "42"');
    expect(output).toContain('"role": "admin"');
  });

  it("prints epoch claims as dates when asked", async () => {
    const token = await makeToken({ sub: "42" }, "2h");
    expect(decodeToken(token, true)).toMatch(/"exp": "\d+ \(20\d\d-/);
  });

  it("returns nothing for empty input", () => {
    expect(decodeToken("   ", true)).toBe("");
  });
});

describe("expiryNote", () => {
  it("reports a live token as not expired", async () => {
    const token = await makeToken({ sub: "1" }, "2h");
    expect(expiryNote(token)?.expired).toBe(false);
  });

  it("reports an expired token as expired", async () => {
    const token = await makeToken({ sub: "1" }, "-1h");
    expect(expiryNote(token)?.expired).toBe(true);
  });

  it("says nothing about a token with no exp", async () => {
    const token = await new SignJWT({ sub: "1" })
      .setProtectedHeader({ alg: "HS256" })
      .sign(SECRET);
    expect(expiryNote(token)).toBeNull();
  });
});

describe("verifyToken", () => {
  it("accepts the right secret", async () => {
    const token = await makeToken({ sub: "1" }, "2h");
    expect(
      await verifyToken(token, "a-secret-long-enough-for-hs256-xx"),
    ).toContain("✓");
  });

  it("rejects the wrong secret", async () => {
    const token = await makeToken({ sub: "1" }, "2h");
    await expect(
      verifyToken(token, "wrong-secret-wrong-secret-wrong"),
    ).rejects.toThrow();
  });

  it("reports an expired token whose signature is still good", async () => {
    const token = await makeToken({ sub: "1" }, "-1h");
    const result = await verifyToken(
      token,
      "a-secret-long-enough-for-hs256-xx",
    );
    expect(result).toContain("süresi dolmuş");
  });

  it("refuses to pretend an unsigned token is verifiable", async () => {
    const unsigned = await new SignJWT({ sub: "1" })
      .setProtectedHeader({ alg: "none" })
      .sign(new Uint8Array(0))
      .catch(() => null);
    // jose will not sign alg:none, so build it by hand — which is exactly the
    // shape of the attack this check exists for.
    const token =
      unsigned ??
      `${btoa('{"alg":"none"}')}.${btoa('{"sub":"1"}')}.`
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    await expect(verifyToken(token, "any-secret")).rejects.toThrow();
  });

  it("requires a key at all", async () => {
    const token = await makeToken({ sub: "1" }, "2h");
    await expect(verifyToken(token, "  ")).rejects.toThrow();
  });
});
