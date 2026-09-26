import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";
import { ToolError } from "../text-tool";
import {
  expiryFor,
  randomSecret,
  secretBytes,
  secretLength,
  signToken,
} from "./logic";

const SECRET = "a-secret-long-enough-for-hs256-xx";
const NOW = Date.UTC(2026, 8, 26, 12, 0, 0);

const sign = (overrides: Partial<Parameters<typeof signToken>[0]> = {}) =>
  signToken({
    payload: '{"sub":"42"}',
    secret: SECRET,
    secretBase64: false,
    algorithm: "HS256",
    lifetime: "1h",
    now: NOW,
    ...overrides,
  });

async function verify(token: string, secret: Uint8Array | string = SECRET) {
  const key =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  return jwtVerify(token, key, { currentDate: new Date(NOW) });
}

describe("signToken", () => {
  it("produces a token that verifies with the same secret", async () => {
    const { token, claims } = await sign();
    const { payload, protectedHeader } = await verify(token);
    expect(payload.sub).toBe("42");
    expect(protectedHeader).toEqual({ alg: "HS256", typ: "JWT" });
    expect(payload.iat).toBe(NOW / 1000);
    expect(payload.exp).toBe(NOW / 1000 + 3600);
    expect(claims.exp).toBe(NOW / 1000 + 3600);
  });

  it("omits exp when there is no lifetime", async () => {
    const { token } = await sign({ lifetime: "none" });
    expect((await verify(token)).payload.exp).toBeUndefined();
  });

  it("can make an already expired token", async () => {
    const { claims } = await sign({ lifetime: "expired" });
    expect(claims.exp).toBe(NOW / 1000 - 3600);
  });

  it("keeps the payload's own iat", async () => {
    const { claims } = await sign({ payload: '{"iat":1000}' });
    expect(claims.iat).toBe(1000);
  });

  it("lets the payload's exp win over the lifetime, and says so", async () => {
    const withExp = await sign({ payload: '{"exp":1924991999}' });
    expect(withExp.claims.exp).toBe(1924991999);
    expect(withExp.expOverridden).toBe(true);
    const none = await sign({
      payload: '{"exp":1924991999}',
      lifetime: "none",
    });
    expect(none.expOverridden).toBe(false);
    expect((await sign()).expOverridden).toBe(false);
  });

  it("rejects a payload that is not a JSON object, with a position for bad JSON", async () => {
    await expect(sign({ payload: "[1,2]" })).rejects.toThrow();
    try {
      await sign({ payload: '{\n  "a": 1,\n}' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).at?.line).toBe(2);
    }
  });

  it("signs with a short secret but warns, by bytes and per algorithm", async () => {
    const short = await sign({ secret: "short" });
    expect(short.shortSecret).toEqual({ bytes: 5, min: 32 });
    await verify(short.token, "short");
    const hs512 = await sign({ algorithm: "HS512" });
    expect(hs512.shortSecret).toEqual({ bytes: 33, min: 64 });
    expect((await sign({ secret: "ş".repeat(16) })).shortSecret).toBeNull();
  });

  it("decodes a base64 secret", async () => {
    const secret = randomSecret(32, true);
    const { token, shortSecret } = await sign({ secret, secretBase64: true });
    expect(shortSecret).toBeNull();
    await verify(token, secretBytes(secret, true));
  });

  it("refuses an empty or unreadable secret, naming the field", async () => {
    await expect(sign({ secret: "" })).rejects.toMatchObject({
      field: "secret",
    });
    await expect(
      sign({ secret: "not base64!", secretBase64: true }),
    ).rejects.toMatchObject({ field: "secret" });
  });
});

describe("secrets", () => {
  it("generates the requested number of random bytes", () => {
    expect(secretLength(randomSecret(64, true), true)).toBe(64);
    expect(secretLength(randomSecret(32, false), true)).toBe(32);
    expect(randomSecret(32, false)).not.toMatch(/[+/=]/);
  });

  it("counts bytes, not characters", () => {
    expect(secretLength("ğ", false)).toBe(2);
    expect(secretLength("!!", true)).toBeNull();
  });
});

describe("expiryFor", () => {
  it("maps each choice to seconds from now", () => {
    expect(expiryFor("15m", NOW)).toBe(NOW / 1000 + 900);
    expect(expiryFor("7d", NOW)).toBe(NOW / 1000 + 604_800);
    expect(expiryFor("none", NOW)).toBeNull();
  });
});
