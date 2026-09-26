import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import { isLocale, LOCALES, pick, t } from "@/i18n";
import { CATEGORY_BY_ID } from "@/tools/categories";
import { TOOL_COMPONENTS } from "@/tools/components";
import { getTool, TOOLS } from "@/tools/registry";
import { IconBadge } from "@/components/ToolIcon";
import FavoriteButton from "@/components/FavoriteButton";
import VisitTracker from "@/components/VisitTracker";

/**
 * Every tool page, prerendered at build time.
 *
 * The input never leaves the browser, so there is nothing per-request to
 * render, and a static page is what makes the tool usable the moment it
 * paints.
 */
export const dynamicParams = false;

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
  const service = tool.networkService ?? null;

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-4 cat-${tool.category}`}>
      <VisitTracker toolId={tool.id} />

      <header className="flex shrink-0 items-center gap-3">
        <IconBadge name={tool.icon} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link
            href={`/${locale}#${category.id}`}
            className="w-fit text-xs font-medium text-tint transition-opacity hover:opacity-80"
          >
            {pick(locale, category.name)}
          </Link>
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            {pick(locale, tool.name)}
          </h1>
          <p className="line-clamp-2 text-xs text-muted-foreground sm:line-clamp-1 sm:text-sm">
            {pick(locale, tool.blurb)}
          </p>
        </div>
        {tool.network && (
          <span
            title={t(locale, "tool.networkWarning")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-warning/40 bg-warning/5 px-2 py-1 text-xs text-warning"
          >
            <Globe className="size-3.5" />
            <span className="md:hidden">
              {service ?? t(locale, "tool.networkTiny")}
            </span>
            <span className="hidden md:inline">
              {service
                ? t(locale, "tool.networkService", { service })
                : t(locale, "tool.networkShort")}
            </span>
          </span>
        )}
        <FavoriteButton locale={locale} toolId={tool.id} />
      </header>

      <Tool locale={locale} />
    </div>
  );
}
