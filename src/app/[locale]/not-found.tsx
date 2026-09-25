import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_LOCALE, t } from "@/i18n";

/**
 * Renders in Turkish regardless of the URL.
 *
 * A not-found page has no route params to read a locale from — the whole
 * reason it rendered is that the segment did not match — so it uses the
 * site's first language rather than guessing.
 */
export default function NotFound() {
  const locale = DEFAULT_LOCALE;

  return (
    <div className="flex flex-col items-start gap-4 py-20">
      <p className="font-mono text-5xl font-semibold text-muted-foreground/40">
        404
      </p>
      <h1 className="text-xl font-semibold tracking-tight">
        {t(locale, "error.notFound")}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t(locale, "error.notFoundHint")}
      </p>
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
      >
        <ArrowLeft className="size-4" />
        {t(locale, "error.backHome")}
      </Link>
    </div>
  );
}
