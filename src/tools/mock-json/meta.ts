import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "mock-json",
  category: "generate",
  icon: "braces",
  name: { tr: "Sahte JSON üret", en: "Mock JSON generator" },
  blurb: {
    tr: "Test için gerçekçi kayıtlar — Türkçe isimler ve şehirlerle, kodlama sorunları testte çıksın diye.",
    en: "Realistic test records with Turkish names and cities, so encoding bugs surface in testing.",
  },
  keywords: {
    tr: ["mock", "sahte", "test verisi", "fixture", "json", "üret", "faker"],
    en: ["mock", "fake", "test data", "fixture", "json", "generate", "faker"],
  },
  related: ["uuid", "json-to-types"],
};
