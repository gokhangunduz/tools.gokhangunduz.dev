import { ToolError } from "../text-tool";

/**
 * Fake records that look like real ones.
 *
 * Turkish names and cities, because the point of test data is to reveal what
 * breaks with real input — and "Şükrü Öztürk, İstanbul" breaks more layouts
 * and more encodings than "John Smith, Springfield" ever will.
 */
const FIRST = [
  "Gökhan",
  "Ayşe",
  "Şükrü",
  "Zeynep",
  "Mehmet",
  "Elif",
  "Çağrı",
  "İpek",
  "Burak",
  "Deniz",
  "Emre",
  "Gül",
  "Hakan",
  "Irmak",
  "Kerem",
  "Leyla",
];

const LAST = [
  "Gündüz",
  "Yılmaz",
  "Öztürk",
  "Şahin",
  "Çelik",
  "Demir",
  "Kaya",
  "Aydın",
  "Doğan",
  "Arslan",
  "Koç",
  "Güneş",
];

const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Trabzon",
  "Gaziantep",
  "Eskişehir",
  "Şanlıurfa",
  "Çanakkale",
];

const DOMAINS = ["example.com", "test.dev", "mail.tr", "sirket.com.tr"];
const ROLES = ["admin", "editor", "viewer", "owner"];

export type Options = {
  count: number;
  fields: string;
  indent: number;
};

export function generateMock(options: Options): string {
  if (
    !Number.isInteger(options.count) ||
    options.count < 1 ||
    options.count > 500
  ) {
    throw new ToolError({
      tr: "Kayıt sayısı 1 ile 500 arasında olmalı.",
      en: "The record count must be between 1 and 500.",
    });
  }

  const names = options.fields
    .split(/[,\s]+/)
    .map((field) => field.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw new ToolError({
      tr: "En az bir alan adı gerekli.",
      en: "At least one field name is needed.",
    });
  }

  const unknown = names.filter((name) => !(name in GENERATORS));
  if (unknown.length > 0) {
    throw new ToolError({
      tr: `Bilinmeyen alan: ${unknown.join(", ")}. Kullanılabilir: ${Object.keys(GENERATORS).join(", ")}`,
      en: `Unknown field: ${unknown.join(", ")}. Available: ${Object.keys(GENERATORS).join(", ")}`,
    });
  }

  const rows = Array.from({ length: options.count }, (_, index) =>
    Object.fromEntries(names.map((name) => [name, GENERATORS[name](index)])),
  );

  return JSON.stringify(rows, null, options.indent);
}

const GENERATORS: Record<string, (index: number) => unknown> = {
  id: (index) => index + 1,
  uuid: () => crypto.randomUUID(),
  name: () => `${pick(FIRST)} ${pick(LAST)}`,
  firstName: () => pick(FIRST),
  lastName: () => pick(LAST),
  email: () => `${slug(pick(FIRST))}.${slug(pick(LAST))}@${pick(DOMAINS)}`,
  phone: () =>
    `+90 5${integer(10, 59)} ${integer(100, 999)} ${integer(10, 99)} ${integer(10, 99)}`,
  city: () => pick(CITIES),
  age: () => integer(18, 75),
  price: () => Number((Math.random() * 990 + 10).toFixed(2)),
  active: () => Math.random() > 0.3,
  role: () => pick(ROLES),
  createdAt: () =>
    new Date(Date.now() - integer(0, 365) * 86_400_000).toISOString(),
  url: () => `https://${pick(DOMAINS)}/${slug(pick(LAST))}`,
  tags: () => Array.from({ length: integer(1, 3) }, () => pick(ROLES)),
};

export const FIELD_NAMES = Object.keys(GENERATORS);

function pick<T>(values: T[]): T {
  return values[integer(0, values.length - 1)];
}

function integer(min: number, max: number): number {
  const span = max - min + 1;
  return min + (crypto.getRandomValues(new Uint32Array(1))[0] % span);
}

/** ASCII for the parts that go into an email address or a URL. */
function slug(value: string): string {
  const map: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };
  return value
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (character) => map[character])
    .replace(/[^a-z]/g, "");
}
