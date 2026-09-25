"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Eraser, MapPin, Upload } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadBlob } from "@/lib/clipboard";
import { formatBytes, readAsDataUrl } from "@/lib/image";
import { ToolError } from "@/tools/text-tool";
import {
  describeLocation,
  FIELDS,
  readFields,
  requireJpeg,
  writeFields,
  type ExifObject,
  type FieldId,
} from "./logic";
import { cn } from "@/lib/utils";

type Loaded = {
  file: File;
  dataUrl: string;
  exif: ExifObject;
  location: string | null;
};

/**
 * An EXIF editor rather than an EXIF viewer.
 *
 * Viewers are everywhere; what is missing is changing a field and getting the
 * file back. Everything happens in the page — the photograph is never
 * uploaded — which for a tool whose whole subject is the metadata attached to
 * personal photographs is the only defensible way to build it.
 */
export default function Tool({ locale }: { locale: Locale }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [values, setValues] = useState<Record<FieldId, string>>(
    {} as Record<FieldId, string>,
  );
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback(
    async (file: File) => {
      setError(null);
      try {
        requireJpeg(file);
        const dataUrl = await readAsDataUrl(file);
        const piexif = (await import("piexifjs")).default;
        const exif = piexif.load(dataUrl) as ExifObject;
        setLoaded({ file, dataUrl, exif, location: describeLocation(exif) });
        setValues(readFields(exif));
      } catch (cause) {
        setLoaded(null);
        setError(
          cause instanceof ToolError
            ? pick(locale, cause.localized)
            : locale === "tr"
              ? "Dosya okunamadı. JPEG olduğundan emin ol."
              : "Could not read the file. Make sure it is a JPEG.",
        );
      }
    },
    [locale],
  );

  const save = useCallback(
    async (strip: boolean) => {
      if (!loaded) return;
      const piexif = (await import("piexifjs")).default;

      const dataUrl = strip
        ? (piexif.remove(loaded.dataUrl) as string)
        : (piexif.insert(
            piexif.dump(writeFields(loaded.exif, values)),
            loaded.dataUrl,
          ) as string);

      const binary = atob(dataUrl.split(",")[1]);
      const bytes = Uint8Array.from(binary, (character) =>
        character.charCodeAt(0),
      );
      const blob = new Blob([bytes], { type: "image/jpeg" });

      const suffix = strip ? "-temiz" : "-exif";
      downloadBlob(
        blob,
        loaded.file.name.replace(/(\.jpe?g)$/i, `${suffix}$1`),
      );
    },
    [loaded, values],
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void open(file);
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void open(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          dragging ? "border-foreground/40 bg-accent/60" : "hover:bg-accent/30",
        )}
      >
        <Upload className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {loaded ? loaded.file.name : t(locale, "file.drop")}
        </p>
        {loaded && (
          <p className="text-xs text-muted-foreground tabular">
            {formatBytes(loaded.file.size)}
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {loaded && (
        <>
          {loaded.location && (
            <p className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
              <MapPin className="size-4 shrink-0" />
              {locale === "tr"
                ? `Bu fotoğraf konum taşıyor: ${loaded.location}`
                : `This photo carries a location: ${loaded.location}`}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.id} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {pick(locale, field.label)}
                </span>
                <Input
                  value={values[field.id] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }))
                  }
                  className="font-mono text-sm"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save(false)}>
              <Download className="size-4" />
              {t(locale, "exif.saveEdited")}
            </Button>
            <Button variant="outline" onClick={() => void save(true)}>
              <Eraser className="size-4" />
              {t(locale, "exif.stripAll")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t(locale, "exif.note")}
          </p>
        </>
      )}
    </div>
  );
}
