import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import { isLocale, LOCALES, pick, t } from "@/i18n";
import { CATEGORY_BY_ID } from "@/tools/categories";
import { TOOL_COMPONENTS } from "@/tools/components";
import { getTool, relatedTools, TOOLS } from "@/tools/registry";
import VisitTracker from "@/components/VisitTracker";

/**
 * Every tool page, prerendered at build time.
 *
 * The pages are static: the input never leaves the browser, so there is
 * nothing per-request to render, and a static page is what makes the tool
 * usable the moment it paints.
 */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    TOOLS.map((tool) => ({ locale, tool: tool.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}): Promise<Metadata> {
  const { locale, tool: toolId } = await params;
  const tool = getTool(toolId);
  if (!isLocale(locale) || !tool) return {};

  return {
    title: pick(locale, tool.name),
    description: pick(locale, tool.blurb),
    keywords: tool.keywords[locale],
    alternates: {
      canonical: `/${locale}/${tool.id}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `/${l}/${tool.id}`]),
      ),
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}) {
  const { locale, tool: toolId } = await params;
  const tool = getTool(toolId);
  const Tool = TOOL_COMPONENTS[toolId];
  if (!isLocale(locale) || !tool || !Tool) notFound();

  const category = CATEGORY_BY_ID[tool.category];
  const related = relatedTools(tool);

  return (
    <div className="flex flex-col gap-8">
      <VisitTracker toolId={tool.id} />

      <header className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">
          {pick(locale, category.name)}
        </p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {pick(locale, tool.name)}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {pick(locale, tool.blurb)}
        </p>
        {tool.network && (
          <p className="mt-1 inline-flex items-center gap-1.5 self-start rounded-md border border-warning/40 bg-warning/5 px-2 py-1 text-xs text-warning">
            <Globe className="size-3.5" />
            {locale === "tr"
              ? "Bu araç sorgu için dış bir servise istek atar."
              : "This tool sends a request to a third-party service."}
          </p>
        )}
      </header>

      <Tool locale={locale} />

      {related.length > 0 && (
        <section className="flex flex-col gap-2 border-t pt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(locale, "tool.related")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/${locale}/${item.id}`}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {pick(locale, item.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
