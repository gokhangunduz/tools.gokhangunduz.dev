import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";
import { signToken } from "./logic";

const SECRET = "a-secret-long-enough-for-hs256-xx";

describe("signToken", () => {
  it("produces a token that verifies with the same secret", async () => {
    const token = await signToken('{"sub":"42"}', SECRET, "HS256", "2h");
    const { payload, protectedHeader } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET),
    );
    expect(payload.sub).toBe("42");
    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("omits exp when no lifetime is given", async () => {
    const token = await signToken('{"sub":"42"}', SECRET, "HS256", "");
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET),
    );
    expect(payload.exp).toBeUndefined();
  });

  it("rejects a payload that is not a JSON object", async () => {
    await expect(signToken("[1,2]", SECRET, "HS256", "2h")).rejects.toThrow();
    await expect(
      signToken("not json", SECRET, "HS256", "2h"),
    ).rejects.toThrow();
  });

  it("rejects a secret short enough to be brute-forced", async () => {
    await expect(
      signToken('{"a":1}', "short", "HS256", "2h"),
    ).rejects.toThrow();
  });

  it("rejects a lifetime it cannot parse", async () => {
    await expect(
      signToken('{"a":1}', SECRET, "HS256", "soon-ish"),
    ).rejects.toThrow();
  });

  it("returns empty for empty input", async () => {
    expect(await signToken("  ", SECRET, "HS256", "2h")).toBe("");
  });
});
