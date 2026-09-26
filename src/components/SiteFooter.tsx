import { ShieldCheck } from "lucide-react";
import { t, type Locale } from "@/i18n";

export default function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="flex shrink-0 flex-col gap-1 border-t px-5 py-3 text-xs text-muted-foreground">
      <p className="flex items-start gap-2">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" />
        {t(locale, "footer.privacy")}
      </p>
      <p className="pl-5.5">© {new Date().getFullYear()} Gökhan Gündüz</p>
    </footer>
  );
}
