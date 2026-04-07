import { describe, expect, it } from "vitest";
import { describePayload } from "./logic";

describe("describePayload", () => {
  it("recognises the payload kinds that matter", () => {
    expect(describePayload("https://x.dev")).toBe("URL");
    expect(describePayload("WIFI:T:WPA;S:ev;P:parola;;")).toBe("Wi-Fi");
    expect(describePayload("BEGIN:VCARD\nFN:Gökhan")).toBe("vCard");
    expect(describePayload("otpauth://totp/x?secret=Y")).toBe("TOTP");
    expect(describePayload("mailto:a@b.dev")).toBe("e-posta / email");
  });

  it("falls back to plain text", () => {
    expect(describePayload("merhaba")).toContain("metin");
  });
});
