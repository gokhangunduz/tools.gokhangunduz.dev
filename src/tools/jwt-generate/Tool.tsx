"use client";

import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Check,
  ChevronDown,
  Copy,
  CopyPlus,
  Dices,
  Eraser,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Wand2,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import {
  Frame,
  KeyValueList,
  Pane,
  PaneButton,
  PaneError,
  PaneTextarea,
  Segmented,
  Split,
} from "@/components/Panel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { copyText } from "@/lib/clipboard";
import {
  encodeShared,
  parseShared,
  readSharedHash,
  subscribeShared,
  writeShared,
} from "@/lib/share";
import {
  restoreValues,
  shareableValues,
  ToolError,
  type OptionValues,
  type ToolOption,
} from "../text-tool";
import { cn } from "@/lib/utils";
import {
  ALGORITHMS,
  expiryFor,
  LIFETIMES,
  MIN_SECRET_BYTES,
  parsePayload,
  randomSecret,
  secretLength,
  signToken,
  type Algorithm,
  type Lifetime,
  type Signed,
} from "./logic";

const LIFETIME_LABELS: Record<Lifetime, Localized> = {
  "15m": { tr: "15m", en: "15m" },
  "1h": { tr: "1h", en: "1h" },
  "1d": { tr: "1d", en: "1d" },
  "7d": { tr: "7d", en: "7d" },
  none: { tr: "Yok", en: "None" },
  expired: { tr: "Süresi dolmuş", en: "Expired" },
};

const OPTIONS: ToolOption[] = [
  {
    kind: "text",
    id: "secret",
    label: { tr: "Secret", en: "Secret" },
    default: "",
    secret: true,
  },
  {
    kind: "select",
    id: "algorithm",
    label: { tr: "Algoritma", en: "Algorithm" },
    default: "HS256",
    choices: ALGORITHMS.map((name) => ({
      value: name,
      label: { tr: name, en: name },
    })),
  },
  {
    kind: "select",
    id: "lifetime",
    label: { tr: "Geçerlilik", en: "Lifetime" },
    default: "1h",
    choices: LIFETIMES.map((value) => ({
      value,
      label: LIFETIME_LABELS[value],
    })),
  },
  {
    kind: "switch",
    id: "secretBase64",
    label: { tr: "Secret base64", en: "Secret is base64" },
    default: false,
  },
];

const SAMPLE =
  '{\n  "sub": "42",\n  "name": "Gökhan Gündüz",\n  "role": "admin"\n}';
const SAMPLE_SECRET = "ornek-gizli-anahtar-en-az-32-karakter";

const COPY = {
  payload: { tr: "Payload", en: "Payload" },
  token: { tr: "Token", en: "Token" },
  placeholder: { tr: "Payload (JSON object)", en: "Payload (a JSON object)" },
  random: { tr: "Rastgele üret", en: "Generate random" },
  bytes: { tr: "{n}/{min} bayt", en: "{n}/{min} bytes" },
  expiresAt: { tr: "bitiş: {date}", en: "expires: {date}" },
  noExpiry: { tr: "exp eklenmez", en: "no exp claim" },
  validJson: {
    tr: "Geçerli JSON · {n} claim",
    en: "Valid JSON · {n} claims",
  },
  enterSecret: {
    tr: "Token için secret gir · secret linke yazılmaz",
    en: "Enter a secret to get a token · the secret is never added to the link",
  },
  shortSecret: {
    tr: "Secret {n} bayt, {alg} için {min} bayttan kısa: brute-force'a açık",
    en: "The secret is {n} bytes, under {min} for {alg}: open to brute force",
  },
  expOverridden: {
    tr: "Payload'daki exp, Geçerlilik alanını geçersiz kılıyor",
    en: "The payload's exp overrides the Lifetime setting",
  },
  copyBearer: { tr: "Bearer olarak kopyala", en: "Copy as Bearer" },
  openDecode: { tr: "JWT decode'da aç", en: "Open in JWT decode" },
  failed: { tr: "Token üretilemedi.", en: "Could not sign the token." },
} satisfies Record<string, Localized>;

const SEGMENT_TONES = ["text-tint", "text-info", "text-muted-foreground"];

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(vars[name] ?? ""),
  );
}

function formatDate(seconds: number, locale: Locale) {
  return new Date(seconds * 1000).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(ms: number, locale: Locale) {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(ms);
  const sign = ms < 0 ? -1 : 1;
  if (abs < 60_000) return format.format(0, "second");
  if (abs < 3_600_000)
    return format.format(sign * Math.round(abs / 60_000), "minute");
  if (abs < 48 * 3_600_000)
    return format.format(sign * Math.round(abs / 3_600_000), "hour");
  return format.format(sign * Math.round(abs / 86_400_000), "day");
}

function useCopied() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string, value: string) => {
    if (await copyText(value)) {
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1400);
    }
  };
  return [copied, copy] as const;
}

const noSubscription = () => () => {};

export default function Tool({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const client = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const shared = useMemo(() => parseShared(hash), [hash]);
  const [typed, setTyped] = useState<string | null>(null);
  const [chosen, setChosen] = useState<OptionValues | null>(null);
  const [masked, setMasked] = useState(true);
  const [clock, setClock] = useState(0);
  const [result, setResult] = useState<{
    request: string;
    signed: Signed | null;
    error: ToolError | null;
  } | null>(null);
  const [copied, copy] = useCopied();
  const secretId = useId();
  const algorithmId = useId();

  const input = typed ?? shared?.input ?? "";
  const values = useMemo(
    () => chosen ?? restoreValues(OPTIONS, shared?.options),
    [chosen, shared],
  );
  const secret = String(values.secret);
  const algorithm = values.algorithm as Algorithm;
  const lifetime = values.lifetime as Lifetime;
  const secretBase64 = values.secretBase64 === true;
  const min = MIN_SECRET_BYTES[algorithm];
  const length = secretLength(secret, secretBase64);

  const setInput = (value: string) => {
    setChosen((prev) => prev ?? values);
    setTyped(value);
  };
  const setOption = (id: string, value: string | boolean) => {
    setTyped((prev) => prev ?? input);
    setChosen((prev) => ({ ...(prev ?? values), [id]: value }));
  };

  useEffect(() => {
    const tick = () => setClock(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const touched = typed !== null || chosen !== null;
  useEffect(() => {
    if (!touched) return;
    const id = window.setTimeout(
      () => writeShared({ input, options: shareableValues(OPTIONS, values) }),
      300,
    );
    return () => window.clearTimeout(id);
  }, [touched, input, values]);

  const payloadState = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { count: Object.keys(parsePayload(input)).length, error: null };
    } catch (cause) {
      return {
        count: null,
        error: cause instanceof ToolError ? cause.localized : COPY.failed,
      };
    }
  }, [input]);

  const request =
    client && input.trim() && secret
      ? JSON.stringify({
          payload: input,
          secret,
          secretBase64,
          algorithm,
          lifetime,
        })
      : null;

  useEffect(() => {
    if (!request) return;
    let live = true;
    signToken({ ...JSON.parse(request), now: Date.now() })
      .then((signed) => {
        if (live) setResult({ request, signed, error: null });
      })
      .catch((cause: unknown) => {
        if (!live) return;
        setResult({
          request,
          signed: null,
          error:
            cause instanceof ToolError ? cause : new ToolError(COPY.failed),
        });
      });
    return () => {
      live = false;
    };
  }, [request]);

  const active = request !== null && result !== null;
  const stale = active && result.request !== request;
  const error = active && !stale ? result.error : null;
  const signed = active ? result.signed : null;
  const decodeLink = signed ? encodeShared(signed.token) : "";

  const expiryPreview = (() => {
    if (!clock) return "";
    const exp = expiryFor(lifetime, clock);
    return exp === null
      ? pick(locale, COPY.noExpiry)
      : fill(pick(locale, COPY.expiresAt), { date: formatDate(exp, locale) });
  })();

  const dateRow = (label: string, value: unknown) =>
    typeof value === "number"
      ? {
          label,
          value: formatDate(value, locale),
          hint: {
            tr: `${clock ? formatRelative(value * 1000 - clock, "tr") : ""} · ${value}`,
            en: `${clock ? formatRelative(value * 1000 - clock, "en") : ""} · ${value}`,
          },
        }
      : null;

  const rows = signed
    ? [
        { label: "alg", value: signed.header.alg },
        { label: "typ", value: signed.header.typ },
        dateRow("iat", signed.claims.iat),
        dateRow("exp", signed.claims.exp),
      ].filter((row) => row !== null)
    : [];

  const toggleLabel = t(locale, masked ? "tool.showValue" : "tool.hideValue");

  const toolbar = (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1.5">
        <label
          htmlFor={secretId}
          className="text-sm text-muted-foreground sm:w-auto"
        >
          {pick(locale, OPTIONS[0].label)}
        </label>
        <span className="relative min-w-0 flex-1 basis-32">
          <Input
            id={secretId}
            type={masked ? "password" : "text"}
            value={secret}
            onChange={(event) => setOption("secret", event.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            data-1p-ignore
            data-lpignore="true"
            aria-invalid={error?.field === "secret" || undefined}
            aria-describedby={`${secretId}-count`}
            className={cn(
              "h-9 pr-8 font-mono text-sm",
              error?.field === "secret" &&
                "border-destructive focus-visible:border-destructive",
            )}
          />
          <button
            type="button"
            onClick={() => setMasked((current) => !current)}
            title={toggleLabel}
            aria-label={toggleLabel}
            aria-pressed={!masked}
            className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {masked ? (
              <Eye className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
          </button>
        </span>
        <span
          id={`${secretId}-count`}
          className={cn(
            "whitespace-nowrap text-xs tabular",
            length !== null && secret && length < min
              ? "text-warning"
              : "text-muted-foreground",
          )}
        >
          {fill(pick(locale, COPY.bytes), { n: length ?? "—", min })}
        </span>
        <PaneButton
          icon={Dices}
          label={pick(locale, COPY.random)}
          className="h-8"
          onClick={() => setOption("secret", randomSecret(min, secretBase64))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label
          htmlFor={algorithmId}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          {pick(locale, OPTIONS[1].label)}
          <span className="relative">
            <select
              id={algorithmId}
              value={algorithm}
              onChange={(event) => setOption("algorithm", event.target.value)}
              className="h-8 appearance-none rounded-md border bg-background pl-2.5 pr-7 text-sm text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25"
            >
              {ALGORITHMS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </span>
        </label>
        <label className="flex select-none items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Switch
            checked={secretBase64}
            onCheckedChange={(checked) => setOption("secretBase64", checked)}
          />
          {pick(locale, OPTIONS[3].label)}
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm text-muted-foreground">
            {pick(locale, OPTIONS[2].label)}
          </span>
          <Segmented
            value={lifetime}
            options={LIFETIMES.map((value) => ({
              id: value,
              label: pick(locale, LIFETIME_LABELS[value]),
            }))}
            onChange={(id) => setOption("lifetime", id)}
            label={pick(locale, OPTIONS[2].label)}
          />
          <span className="text-xs text-muted-foreground tabular">
            {expiryPreview}
          </span>
        </div>
      </div>
    </div>
  );

  const warnings = signed
    ? [
        signed.shortSecret &&
          fill(pick(locale, COPY.shortSecret), {
            n: signed.shortSecret.bytes,
            min: signed.shortSecret.min,
            alg: algorithm,
          }),
        signed.expOverridden && pick(locale, COPY.expOverridden),
      ].filter((line): line is string => Boolean(line))
    : [];

  return (
    <Frame size="split" toolbar={toolbar}>
      <Split>
        <Pane
          label={pick(locale, COPY.payload)}
          footer={
            payloadState?.error ? (
              <span className="text-destructive">
                {pick(locale, payloadState.error)}
              </span>
            ) : payloadState ? (
              fill(pick(locale, COPY.validJson), { n: payloadState.count })
            ) : undefined
          }
          actions={
            <>
              <PaneButton
                icon={Wand2}
                label={t(locale, "tool.sample")}
                labelAlways
                className="h-9 sm:h-7"
                disabled={input === SAMPLE}
                onClick={() => {
                  setTyped(SAMPLE);
                  setChosen({
                    ...values,
                    secret: secret || SAMPLE_SECRET,
                    secretBase64: secret ? secretBase64 : false,
                  });
                }}
              />
              <PaneButton
                icon={Eraser}
                label={t(locale, "tool.clear")}
                showLabel={false}
                disabled={!input}
                onClick={() => setInput("")}
              />
            </>
          }
        >
          <PaneTextarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={pick(locale, COPY.placeholder)}
            aria-label={pick(locale, COPY.payload)}
            sizing="content"
            wrapMode="off"
            spellCheck={false}
            autoFocus
          />
        </Pane>
        <Pane
          label={pick(locale, COPY.token)}
          className="bg-accent/60"
          badge={
            stale ? (
              <Loader2
                aria-label={t(locale, "tool.working")}
                className="size-3.5 shrink-0 animate-spin text-muted-foreground"
              />
            ) : null
          }
          actions={
            <>
              <PaneButton
                icon={copied === "bearer" ? Check : CopyPlus}
                label={
                  copied === "bearer"
                    ? t(locale, "tool.copied")
                    : pick(locale, COPY.copyBearer)
                }
                disabled={!signed || stale}
                onClick={() =>
                  signed && copy("bearer", `Bearer ${signed.token}`)
                }
              />
              <PaneButton
                icon={copied === "token" ? Check : Copy}
                label={
                  copied === "token"
                    ? t(locale, "tool.copied")
                    : t(locale, "tool.copy")
                }
                disabled={!signed || stale}
                onClick={() => signed && copy("token", signed.token)}
              />
            </>
          }
        >
          {error && !payloadState?.error && (
            <PaneError>{pick(locale, error.localized)}</PaneError>
          )}
          {signed ? (
            <div className={cn("flex flex-col", stale && "opacity-60")}>
              <p className="break-all border-b px-3 py-3 font-mono text-sm leading-6">
                {signed.token.split(".").map((part, index) => (
                  <span key={index}>
                    {index > 0 && <span className="text-foreground">.</span>}
                    <span className={SEGMENT_TONES[index]}>{part}</span>
                  </span>
                ))}
              </p>
              {warnings.length > 0 && (
                <ul className="flex flex-col gap-1 border-b px-3 py-2 text-xs text-warning">
                  {warnings.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              <KeyValueList locale={locale} rows={rows} />
              {decodeLink && (
                <a
                  href={`/${locale}/jwt-decode#i=${decodeLink}`}
                  className="mx-3 mb-3 mt-1 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground hover:decoration-foreground"
                >
                  <ExternalLink className="size-3.5" />
                  {pick(locale, COPY.openDecode)}
                </a>
              )}
            </div>
          ) : (
            (!error || payloadState?.error) && (
              <p className="p-3 text-sm text-muted-foreground">
                {!secret
                  ? pick(locale, COPY.enterSecret)
                  : t(locale, "tool.emptyOutput")}
              </p>
            )
          )}
        </Pane>
      </Split>
    </Frame>
  );
}
