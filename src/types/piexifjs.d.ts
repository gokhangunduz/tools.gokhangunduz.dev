/**
 * piexifjs ships no types, and these four functions are the whole API this
 * project needs.
 */
declare module "piexifjs" {
  type ExifDict = Record<string, Record<number, unknown>>;

  const piexif: {
    load(dataUrl: string): ExifDict;
    dump(exif: ExifDict): string;
    insert(exifBytes: string, dataUrl: string): string;
    remove(dataUrl: string): string;
  };

  export default piexif;
}
