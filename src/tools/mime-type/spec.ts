import type { ReferenceSpec } from "../reference-tool";

/**
 * The media types worth knowing, with the extension they go with.
 *
 * Short on purpose: the full IANA registry is thousands of entries and
 * nobody is looking up `application/vnd.3gpp.pic-bw-small`. These are the
 * ones that get typed into a Content-Type header by hand.
 */
export const spec: ReferenceSpec = {
  bilingualColumn: 2,
  columns: [
    { tr: "MIME türü", en: "MIME type" },
    { tr: "Uzantı", en: "Extension" },
    { tr: "Açıklama", en: "Notes" },
  ],
  rows: [
    ["text/html", ".html .htm", "HTML belgesi / HTML document"],
    ["text/css", ".css", "Stil dosyası / Stylesheet"],
    [
      "text/javascript",
      ".js .mjs",
      "JavaScript — application/javascript yerine bu tercih edilir / preferred over application/javascript",
    ],
    ["text/plain", ".txt", "Düz metin / Plain text"],
    ["text/csv", ".csv", "Virgülle ayrılmış tablo / Comma-separated table"],
    ["text/markdown", ".md", "Markdown"],
    ["text/calendar", ".ics", "Takvim / Calendar"],
    ["text/event-stream", "—", "Server-sent events"],
    ["application/json", ".json", "JSON"],
    [
      "application/ld+json",
      ".jsonld",
      "JSON-LD, yapılandırılmış veri / structured data",
    ],
    [
      "application/x-ndjson",
      ".ndjson",
      "Satır başına bir JSON / One JSON per line",
    ],
    ["application/xml", ".xml", "XML"],
    ["application/pdf", ".pdf", "PDF"],
    ["application/zip", ".zip", "ZIP arşivi / ZIP archive"],
    ["application/gzip", ".gz", "gzip arşivi / gzip archive"],
    ["application/wasm", ".wasm", "WebAssembly"],
    [
      "application/octet-stream",
      "—",
      "Bilinmeyen ikili veri; tarayıcı indirir / Unknown binary; the browser downloads it",
    ],
    [
      "application/x-www-form-urlencoded",
      "—",
      "Klasik form gönderimi / A classic form submission",
    ],
    ["multipart/form-data", "—", "Dosya içeren form / A form carrying files"],
    ["image/png", ".png", "PNG"],
    ["image/jpeg", ".jpg .jpeg", "JPEG"],
    ["image/webp", ".webp", "WebP"],
    ["image/avif", ".avif", "AVIF"],
    ["image/gif", ".gif", "GIF"],
    [
      "image/svg+xml",
      ".svg",
      "SVG — XML olduğu için +xml / SVG, hence the +xml",
    ],
    ["image/x-icon", ".ico", "Favicon"],
    ["audio/mpeg", ".mp3", "MP3"],
    ["audio/ogg", ".ogg .opus", "Ogg / Opus"],
    ["audio/wav", ".wav", "WAV"],
    ["video/mp4", ".mp4", "MP4"],
    ["video/webm", ".webm", "WebM"],
    ["font/woff2", ".woff2", "Web yazı tipi / Web font"],
    ["font/ttf", ".ttf", "TrueType"],
  ],
};
