import type { ReferenceSpec } from "../reference-tool";

export const spec: ReferenceSpec = {
  columns: [
    { tr: "Başlık", en: "Header" },
    { tr: "Yön", en: "Direction" },
    { tr: "Ne işe yarar", en: "What it does" },
  ],
  rows: [
    [
      "Authorization",
      "→",
      "Kimlik bilgisi: Bearer <token> ya da Basic <base64>",
    ],
    [
      "Content-Type",
      "↔",
      "Gövdenin türü; yanlışsa sunucu gövdeyi ayrıştıramaz",
    ],
    ["Accept", "→", "İstemcinin kabul ettiği türler"],
    ["Accept-Encoding", "→", "gzip, br — sıkıştırma desteği"],
    [
      "Cache-Control",
      "↔",
      "max-age, no-store, must-revalidate — önbellek kuralları",
    ],
    ["ETag / If-None-Match", "↔", "Sürüm damgası; eşleşirse 304 döner"],
    [
      "Last-Modified / If-Modified-Since",
      "↔",
      "Tarihe dayalı önbellek doğrulaması",
    ],
    ["Location", "←", "Yönlendirme adresi ya da 201'de oluşan kaynağın adresi"],
    ["Retry-After", "←", "429 ve 503'te ne kadar sonra tekrar denenmeli"],
    [
      "Set-Cookie",
      "←",
      "Çerez; HttpOnly, Secure, SameSite ile birlikte kullanılır",
    ],
    ["Cookie", "→", "Saklanan çerezler"],
    ["Origin", "→", "İsteğin kaynağı — CORS kararının girdisi"],
    [
      "Access-Control-Allow-Origin",
      "←",
      "Tarayıcının cevabı okumasına izin verir",
    ],
    [
      "Access-Control-Allow-Credentials",
      "←",
      "Çerezli isteklerde gerekir; * ile birlikte kullanılamaz",
    ],
    [
      "Content-Security-Policy",
      "←",
      "Hangi kaynakların yüklenebileceği — XSS'e karşı",
    ],
    ["Strict-Transport-Security", "←", "Tarayıcıyı HTTPS'e kilitler"],
    [
      "X-Content-Type-Options: nosniff",
      "←",
      "Tarayıcının türü tahmin etmesini engeller",
    ],
    [
      "X-Frame-Options / frame-ancestors",
      "←",
      "Siteyi iframe'e almayı engeller",
    ],
    ["Referrer-Policy", "←", "Referrer'da ne kadar bilgi gideceği"],
    ["Permissions-Policy", "←", "Kamera, konum gibi API'leri kısıtlar"],
    ["Range / Content-Range", "↔", "Kısmi indirme — 206 ile birlikte"],
    ["X-Forwarded-For", "→", "Vekil arkasındaki gerçek istemci adresi"],
    ["X-Request-Id", "↔", "İsteği loglarda izlemek için"],
    ["Vary", "←", "Önbelleğin hangi başlığa göre ayrışacağı"],
  ],
};
