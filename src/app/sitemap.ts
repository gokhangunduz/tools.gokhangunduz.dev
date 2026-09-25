import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n";
import { TOOLS } from "@/tools/registry";

/**
 * Generated from the registry, so a tool is listed the moment it is added
 * and nothing can drift out of date.
 */
const BASE = "https://tools.gokhangunduz.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const homes = LOCALES.map((locale) => ({
    url: `${BASE}/${locale}`,
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}`])),
    },
  }));

  const tools = LOCALES.flatMap((locale) =>
    TOOLS.map((tool) => ({
      url: `${BASE}/${locale}/${tool.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${BASE}/${l}/${tool.id}`]),
        ),
      },
    })),
  );

  return [...homes, ...tools];
}
