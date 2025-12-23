/**
 * Copies text, and says whether it worked.
 *
 * `navigator.clipboard` is unavailable on an insecure origin and can be
 * refused outright by permissions policy, so the caller is told rather than
 * being left showing a "Copied" that did not happen.
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export async function readText(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    // Firefox has no read permission for pages at all; the paste button is a
    // convenience over Cmd+V, never the only way in.
    return null;
  }
}

/** Hands the browser a file built in memory. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoking immediately races the download in Safari; a frame is enough.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain;charset=utf-8",
) {
  downloadBlob(new Blob([value], { type }), filename);
}
