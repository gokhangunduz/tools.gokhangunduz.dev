import type { Localized } from "@/i18n";
import type { ToolOption } from "../text-tool";
import type { Style } from "./logic";

export const STYLES: { id: Style; label: Localized }[] = [
  { id: "camel", label: { tr: "camelCase", en: "camelCase" } },
  { id: "pascal", label: { tr: "PascalCase", en: "PascalCase" } },
  { id: "snake", label: { tr: "snake_case", en: "snake_case" } },
  { id: "kebab", label: { tr: "kebab-case", en: "kebab-case" } },
  { id: "constant", label: { tr: "CONSTANT_CASE", en: "CONSTANT_CASE" } },
  { id: "title", label: { tr: "Title Case", en: "Title Case" } },
  { id: "sentence", label: { tr: "Sentence case", en: "Sentence case" } },
  { id: "upper", label: { tr: "BÜYÜK", en: "UPPERCASE" } },
  { id: "lower", label: { tr: "küçük", en: "lowercase" } },
];

export const SAMPLE =
  "user_id\ngetHTTPResponse\nkullanıcı-adı\nİl ilçe listesi";

export const OPTIONS: ToolOption[] = [
  {
    kind: "switch",
    id: "ascii",
    label: { tr: "ASCII'ye çevir", en: "Convert to ASCII" },
    hint: {
      tr: "camel, Pascal, snake, kebab ve CONSTANT'ta ı→i, ş→s, ğ→g, ç→c, ö→o, ü→u",
      en: "In camel, Pascal, snake, kebab and CONSTANT: ı→i, ş→s, ğ→g, ç→c, ö→o, ü→u",
    },
    default: true,
  },
  {
    kind: "switch",
    id: "turkish",
    label: { tr: "Türkçe kuralları (İ/ı)", en: "Turkish rules (İ/ı)" },
    hint: {
      tr: "BÜYÜK, küçük, Title ve Sentence için; kod stilleri her zaman İngilizce kuralları kullanır",
      en: "For UPPERCASE, lowercase, Title and Sentence; code styles always use the English rules",
    },
    default: true,
  },
];

export const PLACEHOLDER: Localized = {
  tr: "Bir ya da birkaç satır yaz",
  en: "Type one or more lines",
};
