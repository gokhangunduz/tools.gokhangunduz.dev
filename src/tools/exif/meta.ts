import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "exif",
  category: "image",
  icon: "camera",
  name: { tr: "EXIF düzenle", en: "EXIF editor" },
  blurb: {
    tr: "JPEG'in EXIF alanlarını okur, düzenler ve geri yazar; konum varsa uyarır, tek tuşla hepsini siler.",
    en: "Reads, edits and writes a JPEG's EXIF fields, warns if it carries a location, and strips it all in one click.",
  },
  keywords: {
    tr: [
      "exif",
      "metadata",
      "fotoğraf",
      "konum",
      "gps",
      "temizle",
      "düzenle",
      "jpeg",
    ],
    en: [
      "exif",
      "metadata",
      "photo",
      "location",
      "gps",
      "strip",
      "edit",
      "jpeg",
    ],
  },
};
