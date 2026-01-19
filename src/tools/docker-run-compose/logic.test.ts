import { describe, expect, it } from "vitest";
import { parseRun, toCompose } from "./logic";

const COMMAND = `docker run -d --name kasa-db \\
  -p 5432:5432 \\
  -e POSTGRES_PASSWORD=secret \\
  -e POSTGRES_DB=kasa \\
  -v kasa-data:/var/lib/postgresql/data \\
  --restart unless-stopped \\
  postgres:17-alpine -c max_connections=200`;

describe("parseRun", () => {
  it("reads the flags that have a compose equivalent", () => {
    const service = parseRun(COMMAND);
    expect(service.name).toBe("kasa-db");
    expect(service.image).toBe("postgres:17-alpine");
    expect(service.ports).toEqual(["5432:5432"]);
    expect(service.volumes).toEqual(["kasa-data:/var/lib/postgresql/data"]);
    expect(service.environment).toEqual([
      ["POSTGRES_PASSWORD", "secret"],
      ["POSTGRES_DB", "kasa"],
    ]);
    expect(service.restart).toBe("unless-stopped");
    expect(service.command).toEqual(["-c", "max_connections=200"]);
  });

  it("accepts --flag=value as well as --flag value", () => {
    expect(parseRun("docker run --name=api nginx").name).toBe("api");
  });

  it("names the service after the image when --name is absent", () => {
    expect(parseRun("docker run ghcr.io/org/api:1.2").name).toBe("api");
  });

  it("refuses a flag with no compose equivalent instead of dropping it", () => {
    expect(() => parseRun("docker run --cap-add SYS_ADMIN nginx")).toThrow(
      /No compose equivalent/,
    );
  });

  it("refuses an environment variable without =", () => {
    expect(() => parseRun("docker run -e BROKEN nginx")).toThrow();
  });

  it("refuses a command that is not docker run", () => {
    expect(() => parseRun("podman run nginx")).toThrow();
  });

  it("refuses a command with no image", () => {
    expect(() => parseRun("docker run -d")).toThrow(/No image/);
  });
});

describe("toCompose", () => {
  it("writes the service block", () => {
    const output = toCompose(COMMAND, false);
    expect(output).toContain("services:");
    expect(output).toContain("  kasa-db:");
    expect(output).toContain("    image: postgres:17-alpine");
    expect(output).toContain('      - "5432:5432"');
    expect(output).toContain("      POSTGRES_PASSWORD: secret");
    expect(output).toContain("    restart: unless-stopped");
    expect(output).toContain('    command: "-c max_connections=200"');
  });

  it("can print the legacy version header", () => {
    expect(toCompose(COMMAND, true).startsWith('version: "3.9"')).toBe(true);
  });

  it("returns empty for blank input", () => {
    expect(toCompose("  ", false)).toBe("");
  });
});
