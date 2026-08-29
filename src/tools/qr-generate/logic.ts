import type { Localized } from "@/i18n";
import { ToolError } from "../text-tool";

/**
 * A QR code as SVG, so it stays sharp at any size and can be pasted into a
 * document as markup.
 *
 * The error-correction level is exposed because it is the one setting with a
 * real trade-off: a code printed on a label or covered by a logo needs H,
 * and a code on a screen wastes a third of its capacity on it.
 */
export type Level = "L" | "M" | "Q" | "H";

export const LEVELS: Level[] = ["L", "M", "Q", "H"];

/** Byte-mode capacity of the largest code (version 40) per level. */
export const CAPACITY: Record<Level, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export function byteLength(input: string): number {
  return new TextEncoder().encode(input).length;
}

export type Capacity = {
  text: Localized;
  tone: "muted" | "warning" | "destructive";
};

/** "2400 / 2331 bayt · L seviyesinde 2953 sığar" */
export function capacity(input: string, level: Level): Capacity {
  const bytes = byteLength(input);
  const limit = CAPACITY[level];
  const head = {
    tr: `${bytes} / ${limit} bayt`,
    en: `${bytes} / ${limit} bytes`,
  };
  if (bytes > limit) {
    const lower = [...LEVELS].reverse().find((l) => CAPACITY[l] >= bytes);
    return {
      tone: "destructive",
      text: lower
        ? {
            tr: `${head.tr} · ${lower} seviyesinde ${CAPACITY[lower]} sığar`,
            en: `${head.en} · level ${lower} fits ${CAPACITY[lower]}`,
          }
        : {
            tr: `${head.tr} · hiçbir seviyeye sığmaz`,
            en: `${head.en} · too long for any level`,
          },
    };
  }
  return { tone: bytes > limit * 0.8 ? "warning" : "muted", text: head };
}

export async function toSvg(
  input: string,
  level: Level,
  margin: number,
): Promise<string> {
  if (!input.trim()) return "";

  const QRCode = (await import("qrcode")).default;
  try {
    return await QRCode.toString(input, {
      type: "svg",
      errorCorrectionLevel: level,
      margin,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (
      message.includes("too big") ||
      message.includes("code length overflow")
    ) {
      throw new ToolError({
        tr: "Metin bu hata düzeltme seviyesi için çok uzun. Seviyeyi düşür ya da metni kısalt.",
        en: "The text is too long for this error-correction level. Lower the level or shorten the text.",
      });
    }
    throw new ToolError({
      tr: "QR kod üretilemedi.",
      en: "Could not generate the QR code.",
    });
  }
}

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type Wifi = {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
};

/** `\ ; , : "` are escaped with a backslash, as the MECARD-style format requires. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** The `WIFI:` payload phones read to join a network. */
export function wifiPayload({
  ssid,
  password,
  security,
  hidden,
}: Wifi): string {
  if (!ssid) {
    throw new ToolError(
      {
        tr: "Ağ adı (SSID) boş olamaz.",
        en: "The network name (SSID) cannot be empty.",
      },
      { field: "ssid" },
    );
  }
  if (security !== "nopass" && !password) {
    throw new ToolError(
      {
        tr: "Şifreli bir ağ için şifre gerekli; ağ açıksa Güvenlik: Yok seç.",
        en: "A secured network needs a password; for an open network pick Security: None.",
      },
      { field: "password" },
    );
  }
  const parts = [`T:${security}`, `S:${escapeWifi(ssid)}`];
  if (security !== "nopass") parts.push(`P:${escapeWifi(password)}`);
  if (hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}

/** Alt text that says what the code holds without reading out a whole vCard. */
export function altText(payload: string, locale: "tr" | "en"): string {
  const flat = payload.replace(/\s+/g, " ").trim();
  const short = flat.length > 60 ? `${flat.slice(0, 59)}…` : flat;
  return locale === "tr" ? `QR kod: ${short}` : `QR code: ${short}`;
}
