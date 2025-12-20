"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Swaps the first path segment.
 *
 * A link rather than a button, so the other language is a real URL that can be
 * opened in a new tab and indexed. The fragment carries the input, and the
 * browser keeps it across a client navigation, so switching language mid-work
 * does not clear the box.
 */
export default function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center rounded-md border p-0.5 text-xs font-medium">
      {LOCALES.map((code) => (
        <Link
          key={code}
          href={swapLocale(pathname, code)}
          hrefLang={code}
          aria-current={code === locale ? "true" : undefined}
          title={t(locale, `locale.${code}`)}
          className={cn(
            "rounded-[4px] px-2 py-1 uppercase transition-colors",
            code === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </Link>
      ))}
    </div>
  );
}

function swapLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  // ["", "tr", "base64-text"] — the locale is always the first real segment.
  segments[1] = locale;
  return segments.join("/") || `/${locale}`;
}
