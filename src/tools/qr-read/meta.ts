import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "qr-read",
  category: "image",
  icon: "image",
  name: { tr: "QR kod oku", en: "Read a QR code" },
  blurb: {
    tr: "Ekran görüntüsündeki ya da fotoğraftaki kodu okur — koyu temada çekilmiş ters kodlar dahil.",
    en: "Reads a code out of a screenshot or a photo, inverted dark-mode captures included.",
  },
  keywords: {
    tr: ["qr", "oku", "tara", "kod", "görsel", "ekran görüntüsü"],
    en: ["qr", "read", "scan", "decode", "image", "screenshot"],
  },
  related: ["qr-generate", "image-base64"],
};
