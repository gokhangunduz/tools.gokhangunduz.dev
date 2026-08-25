import { describe, expect, it } from "vitest";
import { exportJWK, exportSPKI, generateKeyPair, SignJWT } from "jose";
import {
  cleanToken,
  decodedJson,
  formatRelative,
  SAMPLE_KEY,
  SAMPLE_TOKEN,
  splitToken,
  timeAnnotation,
  timeStatus,
  verifyToken,
} from "./logic";

const SECRET = "a-secret-long-enough-for-hs256-xx";

async function makeToken(claims: Record<string, unknown>, expires: string) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(new TextEncoder().encode(SECRET));
}

describe("cleanToken", () => {
  it("strips a Bearer prefix, quotes and whitespace", () => {
    expect(cleanToken("  Bearer a.b.c\n")).toBe("a.b.c");
    expect(cleanToken("bearer   a.b.c")).toBe("a.b.c");
    expect(cleanToken('"a.b.c"')).toBe("a.b.c");
    expect(cleanToken(" 'Bearer a.b.c' ")).toBe("a.b.c");
    expect(cleanToken('Bearer "a.b.c"')).toBe("a.b.c");
  });
});

describe("splitToken", () => {
  it("rejects anything that is not three parts", () => {
    expect(() => splitToken("abc")).toThrow();
    expect(() => splitToken("a.b")).toThrow();
  });

  it("rejects a part that is not JSON", () => {
    expect(() => splitToken("aGk.aGk.sig")).toThrow();
  });

  it("reads a token behind a Bearer prefix", async () => {
    const token = await makeToken({ sub: "42" }, "2h");
    expect(splitToken(`Bearer ${token}`).payload.sub).toBe("42");
  });

  it("decodes UTF-8 claims", () => {
    expect(splitToken(SAMPLE_TOKEN).payload.name).toBe("Gökhan Gündüz");
  });
});

describe("decodedJson", () => {
  it("keeps timestamps as numbers", () => {
    const json = decodedJson(splitToken(SAMPLE_TOKEN));
    expect(JSON.parse(json).payload.exp).toBe(1924991999);
    expect(json).toContain('"alg": "HS256"');
  });
});

describe("timeStatus", () => {
  const now = Date.UTC(2026, 8, 26);

  it("reports a live token as valid, with the time left", () => {
    const status = timeStatus({ exp: now / 1000 + 3600 }, now);
    expect(status).toEqual({ state: "valid", ms: 3_600_000 });
  });

  it("reports an expired token", () => {
    expect(timeStatus({ exp: now / 1000 - 60 }, now).state).toBe("expired");
  });

  it("reports a token that is not valid yet", () => {
    expect(timeStatus({ nbf: now / 1000 + 60 }, now).state).toBe("notYet");
  });

  it("says when there is no exp", () => {
    expect(timeStatus({ sub: "1" }, now).state).toBe("noExp");
  });
});

describe("formatRelative", () => {
  it("speaks each language, with no mixed units", () => {
    expect(formatRelative(111 * 86_400_000, "tr")).toBe("111 gün sonra");
    expect(formatRelative(-2203 * 86_400_000, "en")).toBe("2,203 days ago");
    expect(formatRelative(3 * 3_600_000, "en")).toBe("in 3 hours");
    expect(formatRelative(-90_000, "tr")).toBe("2 dakika önce");
  });
});

describe("timeAnnotation", () => {
  it("annotates time claims only", () => {
    const now = 1700000000 * 1000;
    expect(timeAnnotation("iat", 1700000000, "en", now)).toContain(
      "in 0 seconds",
    );
    expect(timeAnnotation("sub", 1700000000, "en", now)).toBeNull();
    expect(timeAnnotation("exp", "soon", "en", now)).toBeNull();
  });
});

describe("verifyToken", () => {
  it("verifies the sample with the sample key", async () => {
    expect(await verifyToken(SAMPLE_TOKEN, SAMPLE_KEY)).toEqual({
      status: "valid",
      alg: "HS256",
    });
  });

  it("tells a wrong secret apart from an unreadable key", async () => {
    const token = await makeToken({ sub: "1" }, "2h");
    expect((await verifyToken(token, "wrong-secret")).status).toBe("mismatch");
    expect(
      (await verifyToken(token, "-----BEGIN PUBLIC KEY-----\nxx\n-----END"))
        .status,
    ).toBe("badKey");
  });

  it("checks the signature of an expired token without failing on expiry", async () => {
    const token = await makeToken({ sub: "1" }, "-1h");
    expect((await verifyToken(token, SECRET)).status).toBe("valid");
  });

  it("verifies RS256 with an SPKI key, a JWK and a JWKS", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const token = await new SignJWT({ sub: "1" })
      .setProtectedHeader({ alg: "RS256", kid: "k2" })
      .sign(privateKey);
    const jwk = await exportJWK(publicKey);
    expect((await verifyToken(token, await exportSPKI(publicKey))).status).toBe(
      "valid",
    );
    expect((await verifyToken(token, JSON.stringify(jwk))).status).toBe(
      "valid",
    );
    const other = await exportJWK((await generateKeyPair("RS256")).publicKey);
    const jwks = {
      keys: [
        { ...other, kid: "k1" },
        { ...jwk, kid: "k2" },
      ],
    };
    expect((await verifyToken(token, JSON.stringify(jwks))).status).toBe(
      "valid",
    );
    expect((await verifyToken(token, "plain-secret")).status).toBe("badKey");
  });

  it("refuses to pretend an unsigned token is verifiable", async () => {
    const token = `${btoa('{"alg":"none"}')}.${btoa('{"sub":"1"}')}.`
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    expect(await verifyToken(token, "any-secret")).toEqual({
      status: "unsigned",
    });
  });
});
