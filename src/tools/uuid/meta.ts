import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "uuid",
  category: "generate",
  icon: "braces",
  name: { tr: "UUID / ULID üret", en: "UUID / ULID generator" },
  blurb: {
    tr: "v4, v7, ULID ve Nano ID — v7 zaman damgası taşıdığı için sıralanabilir.",
    en: "v4, v7, ULID and Nano ID — v7 carries a timestamp, so it sorts.",
  },
  keywords: {
    tr: ["uuid", "guid", "ulid", "nanoid", "kimlik", "id", "üret", "v4", "v7"],
    en: [
      "uuid",
      "guid",
      "ulid",
      "nanoid",
      "identifier",
      "id",
      "generate",
      "v4",
      "v7",
    ],
  },
  related: ["password", "mock-json"],
};
