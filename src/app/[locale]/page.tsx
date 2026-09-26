import { notFound } from "next/navigation";
import { isLocale, t } from "@/i18n";
import ToolBrowser from "@/components/ToolBrowser";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-2 sm:py-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(locale, "home.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(locale, "home.subtitle")}
        </p>
      </header>
      <ToolBrowser locale={locale} />
    </div>
  );
}
