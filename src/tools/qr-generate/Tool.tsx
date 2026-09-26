"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  ChevronDown,
  ClipboardCopy,
  Copy,
  Download,
  Eraser,
  Loader2,
  Wand2,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Frame,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  PaneTextarea,
  Segmented,
  Split,
} from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { copyText, downloadBlob, downloadText } from "@/lib/clipboard";
import {
  parseShared,
  readSharedHash,
  subscribeShared,
  writeShared,
} from "@/lib/share";
import {
  defaultValues,
  restoreValues,
  shareableValues,
  ToolError,
  visibleOptions,
  type OptionValue,
  type OptionValues,
} from "../text-tool";
import {
  altText,
  capacity,
  toSvg,
  wifiPayload,
  type Level,
  type WifiSecurity,
} from "./logic";
import { canCopyImage, copyPng, toPng } from "./render";
import { OPTIONS, SAMPLE, WIFI_OPTIONS } from "./spec";
import { cn } from "@/lib/utils";

type Mode = "text" | "wifi";

const noop = () => () => {};

const PNG_SIZES = ["256", "512", "1024"] as const;

const COPY = {
  type: { tr: "Tür", en: "Type" },
  text: { tr: "Metin/URL", en: "Text/URL" },
  wifi: { tr: "Wi-Fi", en: "Wi-Fi" },
  placeholder: {
    tr: "URL, metin, vCard ya da mailto:",
    en: "A URL, text, a vCard or mailto:",
  },
  emptyText: { tr: "Bir URL ya da metin yaz", en: "Type a URL or some text" },
  emptyWifi: {
    tr: "Ağ adını ve şifresini yaz",
    en: "Enter the network name and password",
  },
  png: { tr: "PNG indir", en: "Download PNG" },
  pngSize: { tr: "PNG boyutu", en: "PNG size" },
  copyImage: { tr: "Görseli kopyala", en: "Copy image" },
  svg: { tr: "SVG indir", en: "Download SVG" },
  source: { tr: "SVG kaynağı", en: "SVG source" },
  copySource: { tr: "SVG kodunu kopyala", en: "Copy SVG code" },
  failed: { tr: "QR kod üretilemedi.", en: "Could not generate the QR code." },
} satisfies Record<string, Localized>;

type Outcome = {
  key: string;
  svg: string;
  error: { message: Localized; field?: string } | null;
};

export default function Tool({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const shared = useMemo(() => parseShared(hash), [hash]);

  const [mode, setMode] = useState<Mode>("text");
  const [typed, setTyped] = useState<string | null>(null);
  const [chosen, setChosen] = useState<OptionValues | null>(null);
  const [wifi, setWifi] = useState<OptionValues>(() =>
    defaultValues(WIFI_OPTIONS),
  );
  const [pngSize, setPngSize] = useState<(typeof PNG_SIZES)[number]>("512");
  const [done, setDone] = useState<Outcome | null>(null);
  const [lastSvg, setLastSvg] = useState({ mode: "text" as Mode, svg: "" });
  const [flash, setFlash] = useState<string | null>(null);

  const input = typed ?? shared?.input ?? "";
  const values = useMemo(
    () => chosen ?? restoreValues(OPTIONS, shared?.options),
    [chosen, shared],
  );
  const copyable = useSyncExternalStore(noop, canCopyImage, () => false);
  const level = String(values.level) as Level;
  const margin = Number(values.margin);

  const payload = useMemo((): { text: string; error: ToolError | null } => {
    if (mode === "text") return { text: input, error: null };
    if (
      !String(wifi.ssid) ||
      (wifi.security !== "nopass" && !String(wifi.password))
    ) {
      return { text: "", error: null };
    }
    try {
      return {
        text: wifiPayload({
          ssid: String(wifi.ssid),
          password: String(wifi.password),
          security: String(wifi.security) as WifiSecurity,
          hidden: Boolean(wifi.hidden),
        }),
        error: null,
      };
    } catch (cause) {
      return {
        text: "",
        error: cause instanceof ToolError ? cause : new ToolError(COPY.failed),
      };
    }
  }, [mode, input, wifi]);

  const key = `${payload.text}|${level}|${margin}`;

  useEffect(() => {
    if (payload.error) return;
    let live = true;
    void toSvg(payload.text, level, margin).then(
      (svg) => {
        if (!live) return;
        setDone({ key, svg, error: null });
        if (svg) setLastSvg({ mode, svg });
      },
      (cause: unknown) => {
        if (!live) return;
        setDone({
          key,
          svg: "",
          error: {
            message: cause instanceof ToolError ? cause.localized : COPY.failed,
          },
        });
      },
    );
    return () => {
      live = false;
    };
  }, [key, payload, level, margin, mode]);

  useEffect(() => {
    if (mode === "wifi") {
      writeShared({ input: "" });
    } else if (typed !== null || chosen !== null) {
      writeShared({ input, options: shareableValues(OPTIONS, values) });
    }
  }, [mode, input, typed, chosen, values]);

  const settled = done?.key === key ? done : null;
  const error = payload.error
    ? { message: payload.error.localized, field: payload.error.field }
    : (settled?.error ?? null);
  const svg = settled && !settled.error ? settled.svg : "";
  const empty = !payload.text && !payload.error;
  const shown = svg || (!empty && lastSvg.mode === mode ? lastSvg.svg : "");
  const dim = shown !== "" && shown !== svg;
  const busy = !payload.error && !settled && !empty;
  const room = capacity(payload.text, level);

  const src = useMemo(
    () =>
      shown
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shown)}`
        : "",
    [shown],
  );
  const alt = svg
    ? altText(
        mode === "wifi" ? `Wi-Fi ${String(wifi.ssid)}` : payload.text,
        locale,
      )
    : "";

  const notify = (id: string) => {
    setFlash(id);
    window.setTimeout(
      () => setFlash((current) => (current === id ? null : current)),
      1400,
    );
  };

  const pngName = `qr-${pngSize}.png`;
  const png = () => toPng(payload.text, level, margin, Number(pngSize));

  const setOption = (id: string, value: OptionValue) =>
    setChosen((current) => ({ ...(current ?? values), [id]: value }));
  const setWifiOption = (id: string, value: OptionValue) =>
    setWifi((current) => ({ ...current, [id]: value }));

  return (
    <Frame
      size="split"
      toolbar={
        <>
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pick(locale, COPY.type)}
            </span>
            <Segmented<Mode>
              value={mode}
              label={pick(locale, COPY.type)}
              onChange={setMode}
              options={[
                { id: "text", label: pick(locale, COPY.text) },
                { id: "wifi", label: pick(locale, COPY.wifi) },
              ]}
            />
          </div>
          <OptionRow
            locale={locale}
            options={OPTIONS}
            values={values}
            onChange={setOption}
          />
        </>
      }
    >
      <Split className="grid-rows-[minmax(0,1fr)_minmax(0,2fr)] md:grid-rows-1">
        <Pane
          label={pick(locale, mode === "text" ? COPY.text : COPY.wifi)}
          actions={
            mode === "text" && (
              <>
                {!input && (
                  <PaneButton
                    icon={Wand2}
                    label={t(locale, "tool.sample")}
                    onClick={() => setTyped(SAMPLE)}
                  />
                )}
                <PaneButton
                  icon={Eraser}
                  label={t(locale, "tool.clear")}
                  disabled={!input}
                  showLabel={false}
                  onClick={() => setTyped("")}
                />
              </>
            )
          }
        >
          {mode === "text" ? (
            <PaneTextarea
              value={input}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={pick(locale, COPY.placeholder)}
              aria-label={pick(locale, COPY.text)}
              spellCheck={false}
              autoFocus
            />
          ) : (
            <div className="p-3">
              <OptionRow
                locale={locale}
                options={visibleOptions(WIFI_OPTIONS, wifi)}
                values={wifi}
                onChange={setWifiOption}
                invalidField={error?.field}
              />
            </div>
          )}
        </Pane>

        <Pane
          label="QR"
          className="bg-accent/60"
          badge={
            <>
              {payload.text && (
                <PaneBadge tone={room.tone}>
                  {pick(locale, room.text)}
                </PaneBadge>
              )}
              {busy && shown && (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
              )}
            </>
          }
        >
          {error && <PaneError>{pick(locale, error.message)}</PaneError>}
          <p className="sr-only" aria-live="polite">
            {alt}
          </p>
          {shown ? (
            <div className="flex flex-col items-center gap-3 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className={cn(
                  "aspect-square w-[min(24dvh,320px,100%)] md:w-[min(60vh,320px,100%)] rounded-md border",
                  dim && "opacity-60",
                )}
              />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center">
                  <Button
                    size="sm"
                    disabled={dim}
                    onClick={async () => {
                      try {
                        downloadBlob(await png(), pngName);
                      } catch {}
                    }}
                    className="rounded-r-none"
                  >
                    <Download className="size-3.5" />
                    {pick(locale, COPY.png)}
                  </Button>
                  <span className="relative">
                    <select
                      value={pngSize}
                      aria-label={pick(locale, COPY.pngSize)}
                      onChange={(event) =>
                        setPngSize(event.target.value as typeof pngSize)
                      }
                      className="h-8 appearance-none rounded-r-md border border-l-0 bg-background pl-2 pr-6 text-sm text-foreground tabular outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25"
                    >
                      {PNG_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size} px
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </span>
                </div>
                {copyable && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={dim}
                    onClick={async () => {
                      if (await copyPng(png())) notify("image");
                    }}
                  >
                    {flash === "image" ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <ClipboardCopy className="size-3.5" />
                    )}
                    {flash === "image"
                      ? t(locale, "tool.copied")
                      : pick(locale, COPY.copyImage)}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={dim}
                  onClick={() =>
                    downloadText(shown, "qr.svg", "image/svg+xml;charset=utf-8")
                  }
                >
                  <Download className="size-3.5" />
                  {pick(locale, COPY.svg)}
                </Button>
              </div>
              <details className="w-full max-w-md text-sm">
                <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
                  {pick(locale, COPY.source)}
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-background p-2 font-mono text-xs">
                    {shown}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start text-muted-foreground"
                    onClick={async () => {
                      if (await copyText(shown)) notify("source");
                    }}
                  >
                    {flash === "source" ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {flash === "source"
                      ? t(locale, "tool.copied")
                      : pick(locale, COPY.copySource)}
                  </Button>
                </div>
              </details>
            </div>
          ) : (
            !error && (
              <div className="flex flex-1 items-center justify-center p-4">
                <div className="flex aspect-square w-[min(24dvh,320px,100%)] md:w-[min(60vh,320px,100%)] items-center justify-center rounded-md border border-dashed border-foreground/20 p-6 text-center text-sm text-muted-foreground">
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    pick(
                      locale,
                      mode === "text" ? COPY.emptyText : COPY.emptyWifi,
                    )
                  )}
                </div>
              </div>
            )
          )}
        </Pane>
      </Split>
    </Frame>
  );
}
