import { notFound } from "next/navigation";
import { ShieldCheck, Zap } from "lucide-react";
import { isLocale, t } from "@/i18n";
import { TOOLS } from "@/tools/registry";
import PinnedTools from "@/components/PinnedTools";
import ToolBrowser from "@/components/ToolBrowser";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(locale, "app.tagline")}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5" />
            {t(locale, "nav.toolCount", { count: TOOLS.length })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" />
            {t(locale, "home.promise")}
          </span>
        </p>
      </section>

      <PinnedTools locale={locale} />

      <ToolBrowser locale={locale} />
    </div>
  );
}
