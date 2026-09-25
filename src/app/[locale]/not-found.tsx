import Link from "next/link";
import { DEFAULT_LOCALE, t } from "@/i18n";

/**
 * Renders in Turkish regardless of the URL.
 *
 * A not-found page has no route params to read a locale from — the whole
 * reason it rendered is that the segment did not match — so it uses the site's
 * first language rather than guessing.
 */
export default function NotFound() {
  const locale = DEFAULT_LOCALE;

  return (
    <div className="flex flex-col items-start gap-4 py-16">
      <h1 className="text-xl font-semibold">{t(locale, "error.notFound")}</h1>
      <Link
        href={`/${locale}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {t(locale, "error.backHome")}
      </Link>
    </div>
  );
}
