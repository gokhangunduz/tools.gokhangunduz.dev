import { describe, expect, it } from "vitest";
import { describeHash, hashPassword, verifyPassword } from "./logic";

describe("hashPassword", () => {
  it("produces a hash that verifies against the same password", async () => {
    const hash = await hashPassword("hunter2", 4);
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    expect(await verifyPassword("hunter2", hash)).toContain("✓");
  });

  it("produces a different hash every time, because the salt is random", async () => {
    const a = await hashPassword("hunter2", 4);
    const b = await hashPassword("hunter2", 4);
    expect(a).not.toBe(b);
  });

  it("rejects a cost outside the sane range", async () => {
    await expect(hashPassword("x", 20)).rejects.toThrow();
  });
});

describe("verifyPassword", () => {
  it("says so when the password is wrong", async () => {
    const hash = await hashPassword("hunter2", 4);
    expect(await verifyPassword("hunter3", hash)).toContain("✗");
  });

  it("rejects something that is not a bcrypt hash", async () => {
    await expect(verifyPassword("x", "not-a-hash")).rejects.toThrow();
  });
});

describe("describeHash", () => {
  it("reads the cost out of the hash", () => {
    expect(describeHash("$2b$12$" + "x".repeat(53))).toBe("12");
    expect(describeHash("nope")).toBeNull();
  });
});
