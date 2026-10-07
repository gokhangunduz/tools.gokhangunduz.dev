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
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain;charset=utf-8",
) {
  downloadBlob(new Blob([value], { type }), filename);
}
