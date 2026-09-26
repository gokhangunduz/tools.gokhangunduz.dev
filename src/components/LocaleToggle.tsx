"use client";

import { usePathname } from "next/navigation";
import { LOCALES, t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Swaps the first path segment.
 *
 * A plain link rather than a client navigation: every locale shares the root
 * layout that renders `<html>`, and re-rendering it drops the theme class the
 * head script set, so a full load is what keeps the theme. The fragment carries
 * the input and is appended on click, so switching language keeps the box.
 */
export default function LocaleToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center rounded-md border p-0.5 text-xs font-medium">
      {LOCALES.map((code) => (
        <a
          key={code}
          href={swapLocale(pathname, code)}
          onClick={(event) => {
            event.currentTarget.href =
              swapLocale(pathname, code) + window.location.hash;
          }}
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
        </a>
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
