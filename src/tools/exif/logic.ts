import { ToolError } from "../text-tool";

/**
 * The EXIF fields worth editing, and the plumbing to read and write them.
 *
 * piexifjs works on JPEG only — the EXIF segment is a JPEG APP1 marker, and
 * PNG and WebP carry metadata differently — so editing is offered for JPEG
 * and reading for everything else. Saying that plainly is better than
 * appearing to save a change that was silently dropped.
 */
export type FieldId =
  | "Make"
  | "Model"
  | "Software"
  | "Artist"
  | "Copyright"
  | "ImageDescription"
  | "DateTimeOriginal"
  | "LensModel"
  | "UserComment";

export type Field = {
  id: FieldId;
  label: { tr: string; en: string };
  /** Which IFD piexifjs keeps it in. */
  ifd: "0th" | "Exif";
  tag: number;
};

/** Tag numbers from the EXIF specification; piexifjs keys its objects by them. */
export const FIELDS: Field[] = [
  { id: "Make", label: { tr: "Marka", en: "Make" }, ifd: "0th", tag: 271 },
  { id: "Model", label: { tr: "Model", en: "Model" }, ifd: "0th", tag: 272 },
  {
    id: "Software",
    label: { tr: "Yazılım", en: "Software" },
    ifd: "0th",
    tag: 305,
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
    id: "ImageDescription",
    label: { tr: "Açıklama", en: "Description" },
    ifd: "0th",
    tag: 270,
  },
  {
    id: "DateTimeOriginal",
    label: { tr: "Çekim tarihi", en: "Taken at" },
    ifd: "Exif",
    tag: 36867,
  },
  {
    id: "LensModel",
    label: { tr: "Objektif", en: "Lens" },
    ifd: "Exif",
    tag: 42036,
  },
  {
    id: "UserComment",
    label: { tr: "Not", en: "Comment" },
    ifd: "Exif",
    tag: 37510,
  },
];

export type ExifObject = Record<string, Record<number, unknown>>;

/** Pulls the editable fields out of a piexifjs object. */
export function readFields(exif: ExifObject): Record<FieldId, string> {
  const values = {} as Record<FieldId, string>;
  for (const field of FIELDS) {
    const raw = exif[field.ifd]?.[field.tag];
    values[field.id] =
      typeof raw === "string" ? raw : raw === undefined ? "" : String(raw);
  }
  return values;
}

/** Writes them back, dropping the tag entirely when the value is cleared. */
export function writeFields(
  exif: ExifObject,
  values: Record<FieldId, string>,
): ExifObject {
  const next: ExifObject = {
    ...exif,
    "0th": { ...(exif["0th"] ?? {}) },
    Exif: { ...(exif.Exif ?? {}) },
    GPS: { ...(exif.GPS ?? {}) },
  };

  for (const field of FIELDS) {
    const value = values[field.id];
    if (value === "") delete next[field.ifd][field.tag];
    else next[field.ifd][field.tag] = value;
  }

  return next;
}

/** The GPS block, summarised — the part people most often want gone. */
export function describeLocation(exif: ExifObject): string | null {
  const gps = exif.GPS;
  if (!gps || Object.keys(gps).length === 0) return null;

  const latitude = toDegrees(gps[2], gps[1]);
  const longitude = toDegrees(gps[4], gps[3]);
  if (latitude === null || longitude === null) return "var / present";
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

export function requireJpeg(file: File) {
  if (!/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
    throw new ToolError({
      tr: "EXIF düzenleme yalnız JPEG dosyalarında çalışır. Diğer biçimler okunabilir ama yazılamaz.",
      en: "Editing EXIF works on JPEG only. Other formats can be read but not written.",
    });
  }
}
