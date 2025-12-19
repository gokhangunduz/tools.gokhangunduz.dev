import { notFound } from "next/navigation";
import { isLocale, pick, t } from "@/i18n";
import { populatedCategories } from "@/tools/registry";
import PinnedTools from "@/components/PinnedTools";
import ToolGrid from "@/components/ToolGrid";
import ToolIcon from "@/components/ToolIcon";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const groups = populatedCategories();

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(locale, "app.tagline")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t(locale, "app.description")}
        </p>
      </section>

      <PinnedTools locale={locale} />

      {groups.map(({ category, tools }) => (
        <section key={category.id} className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <ToolIcon
              name={category.icon}
              className="size-4 text-muted-foreground"
            />
            {pick(locale, category.name)}
            <span className="text-xs font-normal text-muted-foreground tabular">
              {tools.length}
            </span>
          </h2>
          <ToolGrid locale={locale} tools={tools} />
        </section>
      ))}
    </div>
  );
}
