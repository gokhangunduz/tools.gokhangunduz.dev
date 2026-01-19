import { ToolError } from "../text-tool";

/**
 * A `docker run` command as a compose service.
 *
 * The command someone has in their shell history is the thing they want to
 * check into a repository, and transcribing it by hand is where the ports get
 * swapped. Only the flags that have a compose equivalent are understood;
 * anything else stops the conversion rather than producing a file that quietly
 * does something different from the command.
 */
type Service = {
  name: string;
  image: string;
  command: string[];
  ports: string[];
  volumes: string[];
  environment: [string, string][];
  envFiles: string[];
  networks: string[];
  restart: string | null;
  workdir: string | null;
  user: string | null;
  entrypoint: string | null;
  labels: string[];
  detached: boolean;
};

export function toCompose(input: string, version: boolean): string {
  if (!input.trim()) return "";

  const service = parseRun(input);
  const lines: string[] = [];

  if (version) lines.push('version: "3.9"', "");
  lines.push("services:", `  ${service.name}:`, `    image: ${service.image}`);

  if (service.entrypoint)
    lines.push(`    entrypoint: ${quote(service.entrypoint)}`);
  if (service.command.length > 0) {
    lines.push(`    command: ${quote(service.command.join(" "))}`);
  }
  if (service.restart) lines.push(`    restart: ${service.restart}`);
  if (service.user) lines.push(`    user: ${quote(service.user)}`);
  if (service.workdir) lines.push(`    working_dir: ${quote(service.workdir)}`);

  // Ports are always quoted: YAML 1.1 reads an unquoted `08:80` as a
  // sexagesimal number, which is the classic way a compose file silently
  // publishes the wrong port.
  pushList(lines, "ports", service.ports, true);
  pushList(lines, "volumes", service.volumes);
  pushList(lines, "env_file", service.envFiles);
  pushList(lines, "networks", service.networks);
  pushList(lines, "labels", service.labels);

  if (service.environment.length > 0) {
    lines.push("    environment:");
    for (const [key, value] of service.environment) {
      lines.push(`      ${key}: ${quote(value)}`);
    }
  }

  return lines.join("\n");
}

function pushList(
  lines: string[],
  key: string,
  values: string[],
  alwaysQuote = false,
) {
  if (values.length === 0) return;
  lines.push(`    ${key}:`);
  for (const value of values) {
    lines.push(`      - ${alwaysQuote ? JSON.stringify(value) : quote(value)}`);
  }
}

/** Quoted unless it is plainly safe, so the YAML cannot change meaning. */
function quote(value: string): string {
  return /^[A-Za-z0-9_./=:@-]+$/.test(value) ? value : JSON.stringify(value);
}

const WITH_VALUE = new Set([
  "-p",
  "--publish",
  "-v",
  "--volume",
  "-e",
  "--env",
  "--env-file",
  "--name",
  "--network",
  "--net",
  "--restart",
  "-w",
  "--workdir",
  "-u",
  "--user",
  "--entrypoint",
  "-l",
  "--label",
  "--mount",
]);

const IGNORED = new Set([
  "-d",
  "--detach",
  "--rm",
  "-it",
  "-i",
  "-t",
  "--interactive",
  "--tty",
  "--init",
  "--privileged",
]);

export function parseRun(input: string): Service {
  const tokens = tokenize(input.replace(/\\\r?\n/g, " "));
  const start = tokens.findIndex((token) => token === "run");
  if (!/^docker$/i.test(tokens[0] ?? "") || start === -1) {
    throw new ToolError({
      tr: "Komut `docker run` ile başlamalı.",
      en: "The command must start with `docker run`.",
    });
  }

  const service: Service = {
    name: "",
    image: "",
    command: [],
    ports: [],
    volumes: [],
    environment: [],
    envFiles: [],
    networks: [],
    restart: null,
    workdir: null,
    user: null,
    entrypoint: null,
    labels: [],
    detached: false,
  };

  let i = start + 1;
  for (; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("-")) break;

    if (IGNORED.has(token)) {
      if (token === "-d" || token === "--detach") service.detached = true;
      continue;
    }

    // Both `--name x` and `--name=x` are in the wild.
    let flag = token;
    let value: string | undefined;
    const equals = token.indexOf("=");
    if (token.startsWith("--") && equals !== -1) {
      flag = token.slice(0, equals);
      value = token.slice(equals + 1);
    }

    if (!WITH_VALUE.has(flag)) {
      throw new ToolError({
        tr: `Bu seçeneğin compose karşılığı yok ya da tanınmıyor: ${flag}`,
        en: `No compose equivalent, or not recognised: ${flag}`,
      });
    }

    if (value === undefined) {
      value = tokens[i + 1];
      if (value === undefined) {
        throw new ToolError({
          tr: `${flag} bir değer bekliyor.`,
          en: `${flag} expects a value.`,
        });
      }
      i += 1;
    }

    switch (flag) {
      case "-p":
      case "--publish":
        service.ports.push(value);
        break;
      case "-v":
      case "--volume":
      case "--mount":
        service.volumes.push(value);
        break;
      case "-e":
      case "--env": {
        const at = value.indexOf("=");
        if (at === -1) {
          throw new ToolError({
            tr: `Ortam değişkeni "AD=değer" olmalı: ${value}`,
            en: `An environment variable must read "NAME=value": ${value}`,
          });
        }
        service.environment.push([value.slice(0, at), value.slice(at + 1)]);
        break;
      }
      case "--env-file":
        service.envFiles.push(value);
        break;
      case "--name":
        service.name = value;
        break;
      case "--network":
      case "--net":
        service.networks.push(value);
        break;
      case "--restart":
        service.restart = value;
        break;
      case "-w":
      case "--workdir":
        service.workdir = value;
        break;
      case "-u":
      case "--user":
        service.user = value;
        break;
      case "--entrypoint":
        service.entrypoint = value;
        break;
      case "-l":
      case "--label":
        service.labels.push(value);
        break;
    }
  }

  if (i >= tokens.length) {
    throw new ToolError({
      tr: "İmaj adı bulunamadı.",
      en: "No image name found.",
    });
  }

  service.image = tokens[i];
  service.command = tokens.slice(i + 1);
  // Without --name, compose needs something: the image's own name is what
  // `docker compose` would have called it anyway.
  if (!service.name) {
    service.name = service.image.split("/").pop()!.split(":")[0];
  }

  return service;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quoteChar: '"' | "'" | null = null;
  let started = false;

  for (let i = 0; i < input.length; i += 1) {
    const character = input[i];
    if (quoteChar) {
      if (character === quoteChar) quoteChar = null;
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quoteChar = character;
      started = true;
      continue;
    }
    if (/\s/.test(character)) {
      if (current || started) tokens.push(current);
      current = "";
      started = false;
      continue;
    }
    current += character;
    started = true;
  }
  if (current || started) tokens.push(current);
  return tokens;
}
