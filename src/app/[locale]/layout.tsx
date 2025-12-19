import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { isLocale, LOCALES, t, type Locale } from "@/i18n";
import { THEME_SCRIPT } from "@/lib/theme";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: {
      default: `${t(locale, "app.name")} — ${t(locale, "app.tagline")}`,
      // Tool pages supply their own name and get the site's after it.
      template: `%s — ${t(locale, "app.short")}`,
    },
    description: t(locale, "app.description"),
    applicationName: t(locale, "app.name"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  };
}

export const viewport: Viewport = {
  // Two entries so the browser chrome follows the palette rather than sitting
  // white above a dark page.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      // The inline script below sets `dark` before React sees the document, so
      // the server's markup and the client's first render differ by design.
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader locale={locale as Locale} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
        <SiteFooter locale={locale as Locale} />
      </body>
    </html>
  );
}
