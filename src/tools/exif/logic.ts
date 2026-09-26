import piexif from "piexifjs";
import type { Localized } from "@/i18n";
import { ToolError, type ResultRow } from "../text-tool";

/**
 * Reading, editing and stripping a JPEG's EXIF, as pure functions over bytes.
 *
 * Only the header (everything before the scan data) is ever turned into the
 * binary string piexifjs works on; the compressed image is carried through
 * untouched, so a 20 MB photo costs what its few kilobytes of metadata cost.
 */
export type FieldId =
  | "Make"
  | "Model"
  | "LensModel"
  | "DateTimeOriginal"
  | "Artist"
  | "Copyright"
  | "Software"
  | "ImageDescription"
  | "UserComment";

export type Field = {
  id: FieldId;
  label: Localized;
  ifd: "0th" | "Exif";
  tag: number;
  placeholder?: string;
  wide?: boolean;
};

export const FIELDS: Field[] = [
  { id: "Make", label: { tr: "Marka", en: "Make" }, ifd: "0th", tag: 271 },
  { id: "Model", label: { tr: "Model", en: "Model" }, ifd: "0th", tag: 272 },
  {
    id: "LensModel",
    label: { tr: "Objektif", en: "Lens" },
    ifd: "Exif",
    tag: 42036,
  },
  {
    id: "DateTimeOriginal",
    label: { tr: "Çekim tarihi", en: "Taken at" },
    ifd: "Exif",
    tag: 36867,
    placeholder: "2026:09:25 14:30:00",
  },
  {
    id: "Artist",
    label: { tr: "Fotoğrafçı", en: "Artist" },
    ifd: "0th",
    tag: 315,
  },
  {
    id: "Copyright",
    label: { tr: "Telif", en: "Copyright" },
    ifd: "0th",
    tag: 33432,
  },
  {
    id: "Software",
    label: { tr: "Yazılım", en: "Software" },
    ifd: "0th",
    tag: 305,
  },
  {
    id: "ImageDescription",
    label: { tr: "Açıklama", en: "Description" },
    ifd: "0th",
    tag: 270,
    wide: true,
  },
  {
    id: "UserComment",
    label: { tr: "Not", en: "Comment" },
    ifd: "Exif",
    tag: 37510,
    wide: true,
  },
];

export type ExifObject = Record<string, Record<number, unknown>>;
export type FieldValues = Record<FieldId, string>;

export type Jpeg = {
  /** SOI up to, not including, the SOS marker, as a binary string. */
  head: string;
  /** The SOS marker onwards, never touched. */
  body: Uint8Array;
};

export type Location = { coordinates: string | null };

export type Inspected = {
  jpeg: Jpeg;
  exif: ExifObject;
  location: Location | null;
  tagCount: number;
};

const ORIENTATION = 274;
const USER_COMMENT = 37510;
const ASCII_PREFIX = "ASCII\0\0\0";
const UNICODE_PREFIX = "UNICODE\0";

const NOT_JPEG: Localized = {
  tr: "Bu dosya JPEG değil. EXIF düzenleme yalnız JPEG'de çalışır; PNG ve WebP metadata'yı farklı taşır.",
  en: "This file is not a JPEG. EXIF editing works on JPEG only; PNG and WebP carry metadata differently.",
};

const BROKEN: Localized = {
  tr: "JPEG okunamadı; dosya bozuk ya da yarım olabilir.",
  en: "Could not read the JPEG; the file may be corrupt or truncated.",
};

const WRITE_FAILED: Localized = {
  tr: 'EXIF yazılamadı; fotoğraftaki bazı etiketler desteklenmiyor. "Tüm EXIF\'i sil ve indir" yine çalışır.',
  en: 'Could not write the EXIF; some tags in this photo are not supported. "Strip all EXIF and download" still works.',
};

/** The first JPEG among dropped or pasted files, and how many others were left out. */
export function pickJpeg<F extends { name: string; type: string }>(
  files: readonly F[],
): { file: F; ignored: number } {
  const file = files.find(isJpegFile);
  if (!file) {
    const name = files[0]?.name || files[0]?.type || "";
    throw new ToolError({
      tr: `${name ? `"${name}" JPEG değil. ` : ""}EXIF düzenleme yalnız JPEG'de (.jpg, .jpeg) çalışır.`,
      en: `${name ? `"${name}" is not a JPEG. ` : ""}EXIF editing works on JPEG (.jpg, .jpeg) only.`,
    });
  }
  return { file, ignored: files.length - 1 };
}

function isJpegFile(file: { name: string; type: string }): boolean {
  return /^image\/p?jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name);
}

export function toBinary(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return out;
}

export function fromBinary(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Splits a JPEG at its first scan, checking the marker structure on the way. */
export function splitJpeg(bytes: Uint8Array): Jpeg {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new ToolError(NOT_JPEG);
  let at = 2;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) throw new ToolError(BROKEN);
    const marker = bytes[at + 1];
    if (marker === 0xff) {
      at += 1;
      continue;
    }
    if (marker === 0xda) {
      return {
        head: toBinary(bytes.subarray(0, at)),
        body: bytes.subarray(at),
      };
    }
    at += 2 + ((bytes[at + 2] << 8) | bytes[at + 3]);
  }
  throw new ToolError(BROKEN);
}

export function joinJpeg({ head, body }: Jpeg): Uint8Array {
  const out = new Uint8Array(head.length + body.length);
  out.set(fromBinary(head));
  out.set(body, head.length);
  return out;
}

/** The header's segments, each with its marker and length bytes. */
function segments(head: string): string[] {
  const out: string[] = [];
  let at = 2;
  while (at + 4 <= head.length) {
    const length = (head.charCodeAt(at + 2) << 8) | head.charCodeAt(at + 3);
    out.push(head.slice(at, at + 2 + length));
    at += 2 + length;
  }
  return out;
}

function withSegments(head: string, keep: (segment: string) => boolean) {
  return "\xff\xd8" + segments(head).filter(keep).join("");
}

const isXmp = (segment: string) =>
  segment.startsWith("\xff\xe1") &&
  segment.slice(4).startsWith("http://ns.adobe.com/");
const xmpHasLocation = (segment: string) =>
  isXmp(segment) && /GPS(Latitude|Longitude)/.test(segment);

/** piexifjs refuses a header that does not end in a scan, so one is lent and taken back. */
function withScan<T>(head: string, run: (jpeg: string) => T): T {
  return run(`${head}\xff\xda`);
}

function dropScan(jpeg: string): string {
  return jpeg.slice(0, -2);
}

export function inspect(bytes: Uint8Array): Inspected {
  const jpeg = splitJpeg(bytes);
  let exif: ExifObject;
  try {
    exif = withScan(jpeg.head, (data) => piexif.load(data)) as ExifObject;
  } catch {
    throw new ToolError(BROKEN);
  }
  const coordinates = describeLocation(exif);
  const gps = Object.keys(exif.GPS ?? {}).length > 0;
  const xmp = segments(jpeg.head).some(xmpHasLocation);
  return {
    jpeg,
    exif,
    location: gps || xmp ? { coordinates } : null,
    tagCount: ["0th", "Exif", "GPS", "Interop"].reduce(
      (sum, ifd) => sum + Object.keys(exif[ifd] ?? {}).length,
      0,
    ),
  };
}

/** Pulls the editable fields out of a piexifjs object, as readable text. */
export function readFields(exif: ExifObject): FieldValues {
  const values = {} as FieldValues;
  for (const field of FIELDS) {
    const raw = exif[field.ifd]?.[field.tag];
    values[field.id] =
      field.tag === USER_COMMENT ? decodeComment(raw) : decodeText(raw);
  }
  return values;
}

/** Writes them back, dropping a tag entirely when its value is cleared. */
export function writeFields(
  exif: ExifObject,
  values: FieldValues,
  { dropLocation = false }: { dropLocation?: boolean } = {},
): ExifObject {
  const next: ExifObject = {
    ...exif,
    "0th": { ...(exif["0th"] ?? {}) },
    Exif: { ...(exif.Exif ?? {}) },
    GPS: dropLocation ? {} : { ...(exif.GPS ?? {}) },
  };

  for (const field of FIELDS) {
    const value = values[field.id].trim();
    if (value === "") delete next[field.ifd][field.tag];
    else
      next[field.ifd][field.tag] =
        field.tag === USER_COMMENT ? encodeComment(value) : encodeText(value);
  }

  return next;
}

/** The fields whose value differs from what the file holds. */
export function changedFields(
  before: FieldValues,
  after: FieldValues,
): FieldId[] {
  return FIELDS.filter(
    (field) => before[field.id].trim() !== after[field.id].trim(),
  ).map((field) => field.id);
}

const DATE = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Checks what can be wrong before writing, and puts the date into EXIF's form. */
export function normalizeFields(values: FieldValues): FieldValues {
  const date = values.DateTimeOriginal.trim();
  if (date === "") return values;
  const match = DATE.exec(date);
  const [, year, month, day, hour, minute, second = "00"] = match ?? [];
  if (
    !match ||
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(day) < 1 ||
    Number(day) > 31 ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59
  ) {
    throw new ToolError(
      {
        tr: "Çekim tarihi YYYY:AA:GG SS:DD:ss biçiminde olmalı, örneğin 2026:09:25 14:30:00.",
        en: "The date taken must look like YYYY:MM:DD HH:MM:SS, e.g. 2026:09:25 14:30:00.",
      },
      { field: "DateTimeOriginal" },
    );
  }
  return {
    ...values,
    DateTimeOriginal: `${year}:${month}:${day} ${hour}:${minute}:${second}`,
  };
}

/** The photo with its fields rewritten, and optionally without any location. */
export function editJpeg(
  { jpeg, exif }: Pick<Inspected, "jpeg" | "exif">,
  values: FieldValues,
  { dropLocation = false }: { dropLocation?: boolean } = {},
): Uint8Array {
  const next = writeFields(exif, normalizeFields(values), { dropLocation });
  let head: string;
  try {
    head = dropScan(
      withScan(jpeg.head, (data) => piexif.insert(piexif.dump(next), data)),
    );
  } catch {
    throw new ToolError(WRITE_FAILED);
  }
  if (dropLocation) head = withSegments(head, (s) => !xmpHasLocation(s));
  return joinJpeg({ head, body: jpeg.body });
}

/**
 * The photo with no EXIF, XMP, IPTC or comment left. The orientation is the
 * one tag put back: without it a phone photo taken upright opens sideways.
 */
export function stripJpeg({
  jpeg,
  exif,
}: Pick<Inspected, "jpeg" | "exif">): Uint8Array {
  let head = withSegments(
    jpeg.head,
    (s) =>
      !s.startsWith("\xff\xe1") &&
      !s.startsWith("\xff\xed") &&
      !s.startsWith("\xff\xfe"),
  );
  const orientation = exif["0th"]?.[ORIENTATION];
  if (typeof orientation === "number" && orientation > 1 && orientation <= 8) {
    const minimal = piexif.dump({ "0th": { [ORIENTATION]: orientation } });
    head = dropScan(withScan(head, (data) => piexif.insert(minimal, data)));
  }
  return joinJpeg({ head, body: jpeg.body });
}

export function outputName(
  name: string,
  kind: "edited" | "stripped",
): Localized {
  const base = name.replace(/\.jpe?g$/i, "") || "photo";
  const ext = /\.jpeg$/i.test(name) ? ".jpeg" : ".jpg";
  return kind === "edited"
    ? { tr: `${base}-duzenlenmis${ext}`, en: `${base}-edited${ext}` }
    : { tr: `${base}-temiz${ext}`, en: `${base}-clean${ext}` };
}

/** The GPS block as decimal degrees, or null when there is none to read. */
export function describeLocation(exif: ExifObject): string | null {
  const gps = exif.GPS;
  if (!gps) return null;
  const latitude = toDegrees(gps[2], gps[1]);
  const longitude = toDegrees(gps[4], gps[3]);
  if (latitude === null || longitude === null) return null;
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function toDegrees(value: unknown, reference: unknown): number | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const parts = value.map((part) =>
    Array.isArray(part) ? part[0] / part[1] : Number(part),
  );
  if (parts.some((part) => !Number.isFinite(part))) return null;
  const degrees = parts[0] + parts[1] / 60 + parts[2] / 3600;
  return reference === "S" || reference === "W" ? -degrees : degrees;
}

/** What the photo says about itself, for the summary beside the preview. */
export function summarize(
  exif: ExifObject,
  size: { width: number; height: number } | null,
): ResultRow[] {
  const zeroth = exif["0th"] ?? {};
  const ex = exif.Exif ?? {};
  const rows: ResultRow[] = [];
  const add = (label: Localized, value: string) => {
    if (value) rows.push({ label, value });
  };

  const make = decodeText(zeroth[271]);
  const model = decodeText(zeroth[272]);
  add(
    { tr: "Kamera", en: "Camera" },
    model.toLowerCase().startsWith(make.toLowerCase())
      ? model
      : [make, model].filter(Boolean).join(" "),
  );
  add({ tr: "Objektif", en: "Lens" }, decodeText(ex[42036]));
  add(
    { tr: "Çekim tarihi", en: "Taken at" },
    formatDate(ex[36867] ?? zeroth[306]),
  );

  const width = size?.width ?? Number(ex[40962]);
  const height = size?.height ?? Number(ex[40963]);
  if (width > 0 && height > 0) {
    const megapixels = (width * height) / 1e6;
    add(
      { tr: "Boyut", en: "Dimensions" },
      `${width} × ${height}${megapixels >= 0.1 ? ` · ${megapixels.toFixed(1)} MP` : ""}`,
    );
  }

  add(
    { tr: "Pozlama", en: "Exposure" },
    [
      aperture(ex[33437]),
      shutter(ex[33434]),
      typeof ex[34855] === "number" ? `ISO ${ex[34855]}` : "",
      focal(ex[37386]),
    ]
      .filter(Boolean)
      .join(" · "),
  );
  return rows;
}

function rational(value: unknown): number | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [num, den] = value as number[];
  return den ? num / den : null;
}

function aperture(value: unknown): string {
  const f = rational(value);
  return f ? `f/${Number(f.toFixed(1))}` : "";
}

function shutter(value: unknown): string {
  const t = rational(value);
  if (!t) return "";
  return t >= 1 ? `${Number(t.toFixed(1))} s` : `1/${Math.round(1 / t)} s`;
}

function focal(value: unknown): string {
  const mm = rational(value);
  return mm ? `${Number(mm.toFixed(1))} mm` : "";
}

function formatDate(value: unknown): string {
  const text = decodeText(value);
  const match = DATE.exec(text);
  if (!match) return text;
  const [, y, mo, d, h, mi, s = "00"] = match;
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

/** ASCII tags hold UTF-8 in practice; a byte string that is not UTF-8 is shown as Latin-1. */
function decodeText(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  if (typeof raw !== "string") return String(raw);
  const trimmed = raw.replace(/[\0\s]+$/, "");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      fromBinary(trimmed),
    );
  } catch {
    return trimmed;
  }
}

function encodeText(value: string): string {
  return toBinary(new TextEncoder().encode(value));
}

function decodeComment(raw: unknown): string {
  if (typeof raw !== "string") return decodeText(raw);
  const prefix = raw.slice(0, 8);
  const rest = raw.slice(8);
  if (prefix === UNICODE_PREFIX) {
    const bytes = fromBinary(rest);
    let evenZeros = 0;
    for (let i = 0; i < bytes.length; i += 2) if (bytes[i] === 0) evenZeros++;
    const encoding =
      evenZeros * 2 >= bytes.length / 2 ? "utf-16be" : "utf-16le";
    return new TextDecoder(encoding).decode(bytes).replace(/[\0\s]+$/, "");
  }
  if (prefix === ASCII_PREFIX || prefix === "\0".repeat(8)) {
    return decodeText(rest);
  }
  return decodeText(raw);
}

function encodeComment(value: string): string {
  if (/^[\x20-\x7e\t\n\r]*$/.test(value)) return ASCII_PREFIX + value;
  let out = UNICODE_PREFIX;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    out += String.fromCharCode(code >> 8, code & 0xff);
  }
  return out;
}
