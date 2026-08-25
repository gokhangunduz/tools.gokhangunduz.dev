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
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Wand2,
} from "lucide-react";
import { pick, t, type Locale, type Localized } from "@/i18n";
import {
  Frame,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  Split,
} from "@/components/Panel";
import { copyText, downloadText, readText } from "@/lib/clipboard";
import {
  parseShared,
  readSharedHash,
  subscribeShared,
  writeShared,
} from "@/lib/share";
import { ToolError } from "../text-tool";
import { cn } from "@/lib/utils";
import {
  decodedJson,
  formatRelative,
  prettyJson,
  SAMPLE_KEY,
  SAMPLE_TOKEN,
  splitToken,
  timeAnnotation,
  timeStatus,
  verifyToken,
  type Decoded,
  type Verdict,
} from "./logic";

const COPY = {
  token: { tr: "Token", en: "Token" },
  placeholder: {
    tr: "JWT yapıştır (Bearer öneki olabilir)",
    en: "Paste a JWT (a Bearer prefix is fine)",
  },
  key: { tr: "Key", en: "Key" },
  keyHint: {
    tr: "secret, PEM (SPKI / X.509) ya da JWK · linke yazılmaz",
    en: "secret, PEM (SPKI / X.509) or JWK · never added to the link",
  },
  keyPlaceholder: {
    tr: "Doğrulamak için isteğe bağlı",
    en: "Optional, to verify the signature",
  },
  decoded: { tr: "Decode", en: "Decoded" },
  header: { tr: "Header", en: "Header" },
  payload: { tr: "Payload", en: "Payload" },
  valid: { tr: "Geçerli · {rel} dolacak", en: "Valid · expires {rel}" },
  expired: { tr: "Süresi doldu · {rel}", en: "Expired · {rel}" },
  notYet: {
    tr: "Henüz geçerli değil · {rel} başlayacak",
    en: "Not valid yet · starts {rel}",
  },
  noExp: { tr: "Süresiz · exp yok", en: "No expiry · no exp claim" },
  enterKey: {
    tr: "İmzayı doğrulamak için key gir",
    en: "Enter a key to verify the signature",
  },
  verifying: { tr: "Doğrulanıyor…", en: "Verifying…" },
  verified: { tr: "İmza doğrulandı ({alg})", en: "Signature verified ({alg})" },
  mismatch: {
    tr: "İmza eşleşmedi — key yanlış ya da token değiştirilmiş",
    en: "Signature does not match — wrong key, or the token was altered",
  },
  badKeySecret: {
    tr: "Key biçimi okunamadı — {alg} için secret bekleniyor",
    en: "Could not read the key — {alg} expects a secret",
  },
  badKeyPublic: {
    tr: "Key biçimi okunamadı — {alg} için PEM (SPKI / X.509) ya da JWK bekleniyor",
    en: "Could not read the key — {alg} expects a PEM (SPKI / X.509) or JWK",
  },
  unsigned: {
    tr: "Token imzasız (alg: none) — doğrulanacak imza yok",
    en: "The token is unsigned (alg: none) — there is no signature to check",
  },
  failed: {
    tr: "Token okunamadı.",
    en: "Could not read the token.",
  },
} satisfies Record<string, Localized>;

const SEGMENT_TONES = ["text-tint", "text-info", "text-muted-foreground"];

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}

const noSubscription = () => () => {};

/** A textarea whose text is drawn by a tinted copy behind it, so each segment has its colour. */
function TokenInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  const shared =
    "col-start-1 row-start-1 m-0 whitespace-pre-wrap break-all border-0 px-3 py-3 font-mono text-sm leading-6";
  const [, prefix, core, suffix] =
    /^(\s*(?:["'`]?\s*bearer\s+)?["'`]?)([\s\S]*?)(["'`]?\s*)$/i.exec(
      value,
    ) ?? ["", "", value, ""];
  return (
    <div className="grid max-h-[7.5rem] min-h-[4.5rem] overflow-auto">
      <div aria-hidden className={cn(shared, "pointer-events-none")}>
        <span className="text-muted-foreground">{prefix}</span>
        {core.split(/(\.)/).map((part, index) =>
          part === "." ? (
            <span key={index} className="text-foreground">
              .
            </span>
          ) : (
            <span
              key={index}
              className={SEGMENT_TONES[Math.min(index / 2, 2)] ?? ""}
            >
              {part}
            </span>
          ),
        )}
        <span className="text-muted-foreground">{suffix}</span>
        {value.endsWith("\n") && " "}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoFocus
        className={cn(
          shared,
          "resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none field-sizing-content placeholder:font-sans placeholder:text-muted-foreground",
        )}
      />
    </div>
  );
}

function JsonBlock({
  title,
  value,
  locale,
  now,
}: {
  title: string;
  value: Record<string, unknown>;
  locale: Locale;
  now: number;
}) {
  const [copied, setCopied] = useState(false);
  const text = prettyJson(value);
  return (
    <section className="flex flex-col border-b last:border-b-0">
      <header className="flex h-9 items-center justify-between pl-3 pr-1.5">
        <h3 className="text-xs font-medium text-foreground">{title}</h3>
        <PaneButton
          icon={copied ? Check : Copy}
          label={
            copied
              ? t(locale, "tool.copied")
              : `${t(locale, "tool.copy")}: ${title}`
          }
          showLabel={false}
          onClick={async () => {
            if (await copyText(text)) {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }
          }}
        />
      </header>
      <pre className="whitespace-pre-wrap break-all px-3 pb-3 font-mono text-sm leading-6 text-foreground">
        {text.split("\n").map((line, index) => {
          const match = /^ {2}"([^"]+)": (-?\d+(?:\.\d+)?),?$/.exec(line);
          const note = match
            ? timeAnnotation(match[1], Number(match[2]), locale, now)
            : null;
          return (
            <div key={index}>
              {line}
              {note && (
                <span className="ml-3 select-none font-sans text-xs text-muted-foreground tabular">
                  {note}
                </span>
              )}
            </div>
          );
        })}
      </pre>
    </section>
  );
}

export default function Tool({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const client = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const shared = useMemo(() => parseShared(hash), [hash]);
  const [typed, setTyped] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [masked, setMasked] = useState(true);
  const [now, setNow] = useState(0);
  const [lastGood, setLastGood] = useState<Decoded | null>(null);
  const [verdict, setVerdict] = useState<{
    request: string;
    verdict: Verdict;
  } | null>(null);
  const keyId = useId();
  const input = typed ?? shared?.input ?? "";

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const parsed = useMemo((): {
    decoded: Decoded | null;
    error: Localized | null;
  } => {
    if (!input.trim()) return { decoded: null, error: null };
    try {
      return { decoded: splitToken(input), error: null };
    } catch (cause) {
      return {
        decoded: null,
        error: cause instanceof ToolError ? cause.localized : COPY.failed,
      };
    }
  }, [input]);

  if (parsed.decoded && parsed.decoded !== lastGood) {
    setLastGood(parsed.decoded);
  } else if (!input.trim() && lastGood) {
    setLastGood(null);
  }
  const view = parsed.decoded ?? (input.trim() ? lastGood : null);
  const stale = !parsed.decoded && view !== null;

  const request =
    client && parsed.decoded && key.trim()
      ? JSON.stringify([input, key])
      : null;
  useEffect(() => {
    if (!request) return;
    const [token, secret] = JSON.parse(request) as [string, string];
    let live = true;
    const id = window.setTimeout(() => {
      verifyToken(token, secret)
        .then((result) => {
          if (live) setVerdict({ request, verdict: result });
        })
        .catch(() => {
          if (live) {
            setVerdict({
              request,
              verdict: { status: "badKey", alg: "?" },
            });
          }
        });
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [request]);

  useEffect(() => {
    if (typed === null) return;
    const id = window.setTimeout(() => writeShared({ input }), 300);
    return () => window.clearTimeout(id);
  }, [typed, input]);

  const current =
    request && verdict?.request === request ? verdict.verdict : null;

  const status = view && now ? timeStatus(view.payload, now) : null;
  const badge = status ? (
    status.state === "noExp" ? (
      <PaneBadge>{pick(locale, COPY.noExp)}</PaneBadge>
    ) : (
      <PaneBadge
        tone={
          status.state === "valid"
            ? "success"
            : status.state === "expired"
              ? "destructive"
              : "muted"
        }
      >
        {fill(pick(locale, COPY[status.state]), {
          rel: formatRelative(status.ms, locale),
        })}
      </PaneBadge>
    )
  ) : null;

  const verifyLine = (() => {
    if (!view || stale) return null;
    if (!key.trim()) {
      return {
        tone: "muted",
        icon: ShieldQuestion,
        text: pick(locale, COPY.enterKey),
      } as const;
    }
    if (!current) {
      return {
        tone: "muted",
        icon: Loader2,
        text: pick(locale, COPY.verifying),
      } as const;
    }
    if (current.status === "valid") {
      return {
        tone: "success",
        icon: ShieldCheck,
        text: fill(pick(locale, COPY.verified), { alg: current.alg }),
      } as const;
    }
    if (current.status === "unsigned") {
      return {
        tone: "destructive",
        icon: ShieldAlert,
        text: pick(locale, COPY.unsigned),
      } as const;
    }
    const message =
      current.status === "mismatch"
        ? COPY.mismatch
        : current.alg.startsWith("HS")
          ? COPY.badKeySecret
          : COPY.badKeyPublic;
    return {
      tone: "destructive",
      icon: ShieldAlert,
      text: fill(pick(locale, message), { alg: current.alg }),
    } as const;
  })();

  const loadSample = () => {
    setTyped(SAMPLE_TOKEN);
    setKey(SAMPLE_KEY);
  };

  return (
    <Frame size="split">
      <Split>
        <Pane
          label={pick(locale, COPY.token)}
          actions={
            <>
              <PaneButton
                icon={Wand2}
                label={t(locale, "tool.sample")}
                labelAlways
                className="h-9 sm:h-7"
                disabled={input === SAMPLE_TOKEN && key === SAMPLE_KEY}
                onClick={loadSample}
              />
              <PaneButton
                icon={ClipboardPaste}
                label={t(locale, "tool.paste")}
                onClick={async () => {
                  const pasted = await readText();
                  if (pasted !== null) setTyped(pasted);
                }}
              />
              <PaneButton
                icon={Eraser}
                label={t(locale, "tool.clear")}
                showLabel={false}
                disabled={!input && !key}
                onClick={() => {
                  setTyped("");
                  setKey("");
                }}
              />
            </>
          }
        >
          <TokenInput
            value={input}
            onChange={setTyped}
            placeholder={pick(locale, COPY.placeholder)}
            label={pick(locale, COPY.token)}
          />
          <div className="flex shrink-0 flex-col gap-1.5 border-t px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={keyId}
                className="text-xs font-medium text-muted-foreground"
              >
                {pick(locale, COPY.key)}
              </label>
              <PaneButton
                icon={masked ? Eye : EyeOff}
                label={t(locale, masked ? "tool.showValue" : "tool.hideValue")}
                showLabel={false}
                onClick={() => setMasked((value) => !value)}
              />
            </div>
            <textarea
              id={keyId}
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder={pick(locale, COPY.keyPlaceholder)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              rows={1}
              className={cn(
                "max-h-40 min-h-9 resize-none rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-sm leading-6 outline-none field-sizing-content placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/10",
                masked && key && "[-webkit-text-security:disc]",
              )}
            />
            <p className="text-xs text-muted-foreground">
              {pick(locale, COPY.keyHint)}
            </p>
          </div>
        </Pane>
        <Pane
          label={pick(locale, COPY.decoded)}
          badge={badge}
          className="bg-accent/60"
          actions={
            <PaneButton
              icon={Download}
              label={t(locale, "tool.download")}
              showLabel={false}
              disabled={!parsed.decoded}
              onClick={() =>
                parsed.decoded &&
                downloadText(
                  decodedJson(parsed.decoded),
                  "jwt.json",
                  "application/json;charset=utf-8",
                )
              }
            />
          }
        >
          {parsed.error && <PaneError>{pick(locale, parsed.error)}</PaneError>}
          {verifyLine && (
            <p
              role="status"
              className={cn(
                "flex shrink-0 items-start gap-2 border-b px-3 py-2 text-sm",
                verifyLine.tone === "success" && "bg-success/5 text-success",
                verifyLine.tone === "destructive" &&
                  "bg-destructive/5 text-destructive",
                verifyLine.tone === "muted" && "text-muted-foreground",
              )}
            >
              <verifyLine.icon
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  verifyLine.icon === Loader2 && "animate-spin",
                )}
              />
              <span className="min-w-0">{verifyLine.text}</span>
            </p>
          )}
          {view ? (
            <div className={cn(stale && "opacity-60")}>
              <JsonBlock
                title={pick(locale, COPY.header)}
                value={view.header}
                locale={locale}
                now={now}
              />
              <JsonBlock
                title={pick(locale, COPY.payload)}
                value={view.payload}
                locale={locale}
                now={now}
              />
            </div>
          ) : (
            !parsed.error && (
              <p className="p-3 text-sm text-muted-foreground">
                {t(locale, "tool.emptyOutput")}
              </p>
            )
          )}
        </Pane>
      </Split>
    </Frame>
  );
}
