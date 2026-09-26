import type { ToolOption } from "../text-tool";

export const SAMPLE = "https://tools.gokhangunduz.dev";

export const OPTIONS: ToolOption[] = [
  {
    kind: "select",
    id: "level",
    label: { tr: "Hata düzeltme", en: "Error correction" },
    default: "M",
    hint: {
      tr: "Üstüne logo konacaksa ya da baskı yıpranacaksa H seç; ekranda M yeter.",
      en: "Pick H for a logo on top or a print that will wear; M is enough on a screen.",
    },
    choices: [
      { value: "L", label: { tr: "L %7", en: "L 7%" } },
      { value: "M", label: { tr: "M %15", en: "M 15%" } },
      { value: "Q", label: { tr: "Q %25", en: "Q 25%" } },
      { value: "H", label: { tr: "H %30", en: "H 30%" } },
    ],
  },
  {
    kind: "select",
    id: "margin",
    label: { tr: "Kenar boşluğu", en: "Margin" },
    default: "4",
    choices: [
      { value: "0", label: { tr: "0 modül", en: "0 modules" } },
      { value: "1", label: { tr: "1 modül", en: "1 module" } },
      { value: "2", label: { tr: "2 modül", en: "2 modules" } },
      {
        value: "4",
        label: { tr: "4 modül (standart)", en: "4 modules (standard)" },
      },
    ],
  },
];

export const WIFI_OPTIONS: ToolOption[] = [
  {
    kind: "text",
    id: "ssid",
    label: { tr: "Ağ adı (SSID)", en: "Network name (SSID)" },
    default: "",
    width: "fill",
  },
  {
    kind: "select",
    id: "security",
    label: { tr: "Güvenlik", en: "Security" },
    default: "WPA",
    choices: [
      { value: "WPA", label: { tr: "WPA/WPA2/WPA3", en: "WPA/WPA2/WPA3" } },
      { value: "WEP", label: { tr: "WEP", en: "WEP" } },
      { value: "nopass", label: { tr: "Yok", en: "None" } },
    ],
  },
  {
    kind: "text",
    id: "password",
    label: { tr: "Şifre", en: "Password" },
    default: "",
    width: "fill",
    sensitive: true,
    secret: true,
    visibleWhen: (values) => values.security !== "nopass",
  },
  {
    kind: "switch",
    id: "hidden",
    label: { tr: "Gizli ağ", en: "Hidden network" },
    default: false,
  },
];
