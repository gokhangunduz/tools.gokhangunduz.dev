import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n";

/**
 * Sends the bare domain to a language.
 *
 * Only `/` is handled: every other path already carries its locale, and a
 * middleware that rewrote those would put a redirect in front of every tool
 * page for no gain. Turkish is the fallback — it is this site's first
 * language — and the visitor can switch in the header, which is remembered by
 * the URL they then share.
 */
export function proxy(request: NextRequest) {
  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find((code) => (LOCALES as readonly string[]).includes(code));

  const url = request.nextUrl.clone();
  url.pathname = `/${preferred ?? DEFAULT_LOCALE}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: "/" };
