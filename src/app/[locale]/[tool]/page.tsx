import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Globe } from "lucide-react";
import { isLocale, LOCALES, pick, t } from "@/i18n";
import { CATEGORY_BY_ID } from "@/tools/categories";
import { TOOL_COMPONENTS } from "@/tools/components";
import {
  getTool,
  relatedTools,
  TOOLS,
  toolsInCategory,
} from "@/tools/registry";
import ToolIcon from "@/components/ToolIcon";
import FavoriteButton from "@/components/FavoriteButton";
import VisitTracker from "@/components/VisitTracker";

/**
 * Every tool page, prerendered at build time.
 *
 * The input never leaves the browser, so there is nothing per-request to
 * render, and a static page is what makes the tool usable the moment it
 * paints.
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

  const title = pick(locale, tool.name);
  const description = pick(locale, tool.blurb);

  return {
    title,
    description,
    keywords: tool.keywords[locale],
    alternates: {
      canonical: `/${locale}/${tool.id}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `/${l}/${tool.id}`]),
      ),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "tr" ? "tr_TR" : "en_US",
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
  // Explicit relations first, then the rest of the category — a tool with no
  // `related` still leads somewhere, and the row is never empty.
  const explicit = relatedTools(tool);
  const siblings = toolsInCategory(tool.category).filter(
    (item) =>
      item.id !== tool.id && !explicit.some((entry) => entry.id === item.id),
  );
  const related = [...explicit, ...siblings].slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <VisitTracker toolId={tool.id} />

      <header className="flex flex-col gap-2">
        <Link
          href={`/${locale}#${category.id}`}
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3" />
          {pick(locale, category.name)}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
            <ToolIcon
              name={tool.icon}
              className="size-5 shrink-0 text-muted-foreground"
            />
            {pick(locale, tool.name)}
          </h1>
          <FavoriteButton locale={locale} toolId={tool.id} />
        </div>

        <p className="max-w-2xl text-sm text-muted-foreground">
          {pick(locale, tool.blurb)}
        </p>

        {tool.network && (
          <p className="mt-1 inline-flex items-center gap-1.5 self-start rounded-md border border-warning/40 bg-warning/5 px-2 py-1 text-xs text-warning">
            <Globe className="size-3.5" />
            {t(locale, "tool.networkWarning")}
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
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ToolIcon name={item.icon} className="size-3.5" />
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
