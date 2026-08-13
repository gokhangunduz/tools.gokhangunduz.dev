"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from "react";
import {
  Check,
  Download,
  Eraser,
  FileX2,
  MapPin,
  MapPinOff,
  RotateCcw,
  Undo2,
  Upload,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Frame,
  KeyValueList,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  Split,
} from "@/components/Panel";
import { downloadBlob } from "@/lib/clipboard";
import { formatBytes, naturalSize } from "@/lib/image";
import { ToolError } from "@/tools/text-tool";
import {
  changedFields,
  editJpeg,
  FIELDS,
  inspect,
  outputName,
  pickJpeg,
  readFields,
  stripJpeg,
  summarize,
  type FieldValues,
  type Inspected,
} from "./logic";
import { cn } from "@/lib/utils";

const CHECKER =
  "bg-[repeating-conic-gradient(var(--color-muted)_0_25%,transparent_0_50%)]";

const COPY = {
  drop: (key: string): Localized => ({
    tr: `JPEG'i bırak, yapıştır (${key}) ya da tıkla`,
    en: `Drop a JPEG, paste (${key}) or click`,
  }),
  local: {
    tr: "JPEG · fotoğraf cihazından çıkmaz",
    en: "JPEG · the photo never leaves your device",
  },
  replace: { tr: "Değiştir", en: "Replace" },
  ignored: (count: number): Localized => ({
    tr: `${count + 1} dosya geldi; yalnız ilki kullanıldı.`,
    en: `${count + 1} files received; only the first was used.`,
  }),
  failed: { tr: "Dosya okunamadı.", en: "The file could not be read." },
  photo: { tr: "Fotoğraf", en: "Photo" },
  tags: (count: number): Localized => ({
    tr: `${count} EXIF etiketi`,
    en: `${count} EXIF tag${count === 1 ? "" : "s"}`,
  }),
  noExif: {
    tr: "Bu fotoğrafta okunacak EXIF yok.",
    en: "This photo carries no EXIF to read.",
  },
  fields: { tr: "Düzenlenebilir alanlar", en: "Editable fields" },
  changed: (count: number): Localized => ({
    tr: `${count} değişiklik`,
    en: `${count} change${count === 1 ? "" : "s"}`,
  }),
  reset: { tr: "Değişiklikleri geri al", en: "Revert changes" },
  emptyRemoves: {
    tr: "Boş bıraktığın alan dosyadan silinir.",
    en: "A field left empty is removed from the file.",
  },
  hasLocation: {
    tr: "Bu fotoğraf GPS konumu taşıyor",
    en: "This photo carries a GPS location",
  },
  dropLocation: { tr: "Konumu sil", en: "Remove location" },
  locationDropped: {
    tr: "Konum, indireceğin dosyadan çıkarılacak.",
    en: "The location will be left out of the file you download.",
  },
  undo: { tr: "Geri al", en: "Undo" },
  saveEdited: { tr: "Düzenlenmiş hali indir", en: "Download edited" },
  stripAll: {
    tr: "Tüm EXIF'i sil ve indir",
    en: "Strip all EXIF and download",
  },
  stripHint: {
    tr: "EXIF, XMP ve IPTC silinir; fotoğraf yan dönmesin diye yalnız yön (Orientation) etiketi kalır.",
    en: "Removes EXIF, XMP and IPTC; only the Orientation tag stays so the photo does not open sideways.",
  },
} as const;

const noop = () => () => {};

type Loaded = Inspected & { file: File; original: FieldValues };

export default function Tool({ locale }: { locale: Locale }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [values, setValues] = useState<FieldValues | null>(null);
  const [dropLocation, setDropLocation] = useState(false);
  const [error, setError] = useState<{
    message: Localized;
    field?: string;
  } | null>(null);
  const [ignored, setIgnored] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteKey = useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘V" : "Ctrl+V"),
    () => "⌘V",
  );

  const fail = (cause: unknown) =>
    setError(
      cause instanceof ToolError
        ? { message: cause.localized, field: cause.field }
        : { message: COPY.failed },
    );

  const take = useCallback(async (files: readonly File[]) => {
    if (files.length === 0) return false;
    try {
      const chosen = pickJpeg(files);
      const result = inspect(new Uint8Array(await chosen.file.arrayBuffer()));
      const original = readFields(result.exif);
      setLoaded({ ...result, file: chosen.file, original });
      setValues(original);
      setDropLocation(false);
      setIgnored(chosen.ignored);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof ToolError
          ? { message: cause.localized }
          : { message: COPY.failed },
      );
    }
    return true;
  }, []);

  const choose = useCallback(() => inputRef.current?.click(), []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input:not([type=file]), textarea, select"))
      ) {
        return;
      }
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length > 0) {
        event.preventDefault();
        void take(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [take]);

  const file = loaded?.file ?? null;
  const thumb = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    if (!thumb) return;
    return () => URL.revokeObjectURL(thumb);
  }, [thumb]);

  const [measured, setMeasured] = useState<{
    src: string;
    size: { width: number; height: number } | null;
  } | null>(null);
  useEffect(() => {
    if (!thumb) return;
    let live = true;
    void naturalSize(thumb).then((size) => {
      if (live) setMeasured({ src: thumb, size });
    });
    return () => {
      live = false;
    };
  }, [thumb]);
  const dimensions = measured?.src === thumb ? measured.size : null;

  const summary = useMemo(
    () => (loaded ? summarize(loaded.exif, dimensions) : []),
    [loaded, dimensions],
  );
  const changed =
    loaded && values ? changedFields(loaded.original, values).length : 0;

  const clear = () => {
    setLoaded(null);
    setValues(null);
    setDropLocation(false);
    setError(null);
    setIgnored(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const save = (kind: "edited" | "stripped") => {
    if (!loaded || !values) return;
    try {
      const bytes =
        kind === "edited"
          ? editJpeg(loaded, values, { dropLocation })
          : stripJpeg(loaded);
      setError(null);
      downloadBlob(
        new Blob([bytes as BlobPart], { type: "image/jpeg" }),
        pick(locale, outputName(loaded.file.name, kind)),
      );
    } catch (cause) {
      fail(cause);
    }
  };

  const drop = {
    onDragOver: (event: DragEvent) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setDragging(false);
      }
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      void take(Array.from(event.dataTransfer.files));
    },
  };

  return (
    <Frame
      size={loaded ? "fill" : "content"}
      toolbar={
        <>
          <PaneButton
            icon={Eraser}
            label={t(locale, "tool.clear")}
            disabled={!loaded && !error}
            onClick={clear}
          />
          {loaded && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                title={pick(locale, COPY.stripHint)}
                onClick={() => save("stripped")}
              >
                <FileX2 className="size-3.5" />
                {pick(locale, COPY.stripAll)}
              </Button>
              <Button size="sm" onClick={() => save("edited")}>
                <Download className="size-3.5" />
                {pick(locale, COPY.saveEdited)}
              </Button>
            </div>
          )}
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,.jpg,.jpeg"
        className="hidden"
        onChange={(event) => {
          void take(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <div
        className={cn(
          "relative flex min-h-0 flex-col",
          loaded && "flex-1",
          dragging &&
            "after:pointer-events-none after:absolute after:inset-0 after:bg-tint/5 after:ring-2 after:ring-inset after:ring-tint/40",
        )}
        {...drop}
      >
        {error && !error.field && (
          <PaneError>{pick(locale, error.message)}</PaneError>
        )}

        {!loaded || !values ? (
          <div className="p-3">
            <button
              type="button"
              onClick={choose}
              className="flex max-h-80 min-h-48 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/20 px-4 py-10 text-center outline-none transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:min-h-64"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {pick(locale, COPY.drop(pasteKey))}
              </span>
              <span className="text-xs text-muted-foreground">
                {pick(locale, COPY.local)}
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b px-3 py-2">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[length:8px_8px]",
                  CHECKER,
                )}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p
                  className="truncate text-sm font-medium"
                  title={loaded.file.name}
                >
                  {loaded.file.name}
                </p>
                <p className="truncate text-xs text-muted-foreground tabular">
                  {formatBytes(loaded.file.size)}
                  {dimensions && ` · ${dimensions.width}×${dimensions.height}`}
                  {ignored > 0 && ` · ${pick(locale, COPY.ignored(ignored))}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={choose}>
                <Upload className="size-3.5" />
                {pick(locale, COPY.replace)}
              </Button>
            </div>

            {loaded.location && (
              <div
                role="status"
                className={cn(
                  "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-3 py-2 text-sm",
                  dropLocation
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-warning/30 bg-warning/5 text-warning",
                )}
              >
                {dropLocation ? (
                  <Check className="size-4 shrink-0" />
                ) : (
                  <MapPin className="size-4 shrink-0" />
                )}
                <p className="min-w-0 flex-1">
                  {dropLocation ? (
                    pick(locale, COPY.locationDropped)
                  ) : (
                    <>
                      <span className="font-medium">
                        {pick(locale, COPY.hasLocation)}
                      </span>
                      {loaded.location.coordinates && (
                        <span className="block font-mono text-xs tabular sm:inline">
                          <span className="hidden sm:inline">{" · "}</span>
                          {loaded.location.coordinates}
                        </span>
                      )}
                    </>
                  )}
                </p>
                {dropLocation ? (
                  <PaneButton
                    icon={Undo2}
                    label={pick(locale, COPY.undo)}
                    labelAlways
                    onClick={() => setDropLocation(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDropLocation(true)}
                    className="border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                  >
                    <MapPinOff className="size-3.5" />
                    {pick(locale, COPY.dropLocation)}
                  </Button>
                )}
              </div>
            )}

            <Split className="grid-rows-[minmax(0,2fr)_minmax(0,3fr)] md:grid-rows-1">
              <Pane
                label={pick(locale, COPY.photo)}
                badge={
                  <PaneBadge>
                    {pick(locale, COPY.tags(loaded.tagCount))}
                  </PaneBadge>
                }
              >
                <div className="relative min-h-36 flex-1">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={loaded.file.name}
                      className="absolute inset-0 size-full object-contain p-3"
                    />
                  )}
                </div>
                <div className="shrink-0 border-t">
                  {summary.length > 0 ? (
                    <KeyValueList locale={locale} rows={summary} />
                  ) : (
                    <p className="px-3 py-3 text-sm text-muted-foreground">
                      {pick(locale, COPY.noExif)}
                    </p>
                  )}
                </div>
              </Pane>

              <Pane
                label={pick(locale, COPY.fields)}
                badge={
                  changed > 0 && (
                    <PaneBadge tone="warning">
                      {pick(locale, COPY.changed(changed))}
                    </PaneBadge>
                  )
                }
                actions={
                  <PaneButton
                    icon={RotateCcw}
                    label={pick(locale, COPY.reset)}
                    disabled={changed === 0}
                    onClick={() => {
                      setValues(loaded.original);
                      setError(null);
                    }}
                  />
                }
                footer={pick(locale, COPY.emptyRemoves)}
              >
                <div className="grid gap-3 p-3 lg:grid-cols-2">
                  {FIELDS.map((field) => {
                    const invalid = error?.field === field.id;
                    return (
                      <label
                        key={field.id}
                        className={cn(
                          "flex min-w-0 flex-col gap-1.5",
                          field.wide && "lg:col-span-2",
                        )}
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {pick(locale, field.label)}
                        </span>
                        <Input
                          value={values[field.id]}
                          placeholder={field.placeholder}
                          aria-invalid={invalid || undefined}
                          onChange={(event) => {
                            const value = event.target.value;
                            setValues((current) =>
                              current
                                ? { ...current, [field.id]: value }
                                : current,
                            );
                            if (invalid) setError(null);
                          }}
                          className={cn(
                            "text-sm",
                            field.placeholder && "font-mono tabular",
                          )}
                        />
                        {invalid && error && (
                          <span
                            role="alert"
                            data-tool-error
                            className="text-xs text-destructive"
                          >
                            {pick(locale, error.message)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </Pane>
            </Split>
          </>
        )}
      </div>
    </Frame>
  );
}
