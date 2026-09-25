import { ShieldCheck } from "lucide-react";
import { t, type Locale } from "@/i18n";

export default function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-success" />
          {t(locale, "footer.privacy")}
        </p>
        <p>© {new Date().getFullYear()} Gökhan Gündüz</p>
      </div>
    </footer>
  );
}
