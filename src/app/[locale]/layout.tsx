import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { isLocale, LOCALES, t, type Locale } from "@/i18n";
import { THEME_SCRIPT } from "@/lib/theme";
import ServiceWorker from "@/components/ServiceWorker";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Sidebar, { SidebarRail } from "@/components/Sidebar";
import "../globals.css";

export const dynamicParams = false;

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
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
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
      <body className="flex h-dvh flex-col overflow-hidden">
        {/* First in the tab order and invisible until focused: a keyboard
            visitor should not walk the header to reach the tool. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
        >
          {t(locale, "nav.skipToContent")}
        </a>
        <SiteHeader locale={locale as Locale} />
        <div className="flex min-h-0 flex-1">
          <SidebarRail>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Sidebar locale={locale as Locale} />
            </div>
            <SiteFooter locale={locale as Locale} />
          </SidebarRail>
          <main
            id="main"
            className="flex min-w-0 flex-1 flex-col overflow-y-auto"
          >
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
              {children}
            </div>
          </main>
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
