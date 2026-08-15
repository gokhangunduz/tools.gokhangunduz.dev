"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  ClipboardPaste,
  Copy,
  Eraser,
  Loader2,
  Wand2,
} from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import {
  Frame,
  KeyValueList,
  Pane,
  PaneBadge,
  PaneButton,
  PaneError,
  PaneTextarea,
  Split,
} from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { copyText, readText } from "@/lib/clipboard";
import {
  parseShared,
  readSharedHash,
  subscribeShared,
  writeShared,
} from "@/lib/share";
import type { OptionValue, ToolOption } from "../text-tool";
import { cn } from "@/lib/utils";
import {
  ALGORITHM_NAMES,
  findMatch,
  formatDigests,
  hasTrailingNewline,
  hashAll,
  stripTrailingNewlines,
  utf8Length,
  type Digest,
} from "./logic";

const SAMPLE = "Merhaba dünya";
const DIGEST = /^[0-9a-f]{8}$|^[0-9a-f]{32,128}$/i;

const OPTIONS: ToolOption[] = [
  {
    kind: "text",
    id: "expected",
    label: { tr: "Karşılaştır", en: "Compare" },
    placeholder: {
      tr: "Beklenen hash'i yapıştır",
      en: "Paste the expected hash",
    },
    default: "",
    width: "fill",
  },
  {
    kind: "switch",
    id: "upper",
    label: { tr: "Büyük harf", en: "Uppercase" },
    default: false,
  },
];

const COPY = {
  copyAll: { tr: "Tümünü kopyala", en: "Copy all" },
  matches: { tr: "✓ eşleşiyor", en: "✓ matches" },
  matchBadge: { tr: "{name} eşleşiyor", en: "{name} matches" },
  noMatch: {
    tr: "Hiçbir algoritmayla eşleşmedi",
    en: "Matches no algorithm",
  },
  newline: {
    tr: "Sonda satır sonu var — dahil ediliyor",
    en: "Ends with a line break — it is hashed too",
  },
  remove: { tr: "Kaldır", en: "Remove" },
  failed: {
    tr: "Hash hesaplanamadı. Sayfayı yenileyip tekrar dene.",
    en: "Could not compute the hashes. Reload the page and try again.",
  },
};

const noSubscription = () => () => {};

export default function Tool({ locale }: { locale: Locale }) {
  const hash = useSyncExternalStore(subscribeShared, readSharedHash, () => "");
  const client = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const shared = useMemo(() => parseShared(hash), [hash]);
  const linkedDigest =
    shared && !shared.options && DIGEST.test(shared.input.trim())
      ? shared.input.trim()
      : null;

  const [typed, setTyped] = useState<string | null>(null);
  const [chosen, setChosen] = useState<{
    expected: string;
    upper: boolean;
  } | null>(null);
  const input = typed ?? (linkedDigest ? "" : (shared?.input ?? ""));
  const values = chosen ?? {
    expected: linkedDigest ?? "",
    upper: shared?.options?.upper === true,
  };

  const [result, setResult] = useState<{
    input: string;
    upper: boolean;
    digests: Digest[] | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!client || !input) return;
    let live = true;
    const run = () =>
      hashAll(input, values.upper)
        .then((digests) => {
          if (live) setResult({ input, upper: values.upper, digests });
        })
        .catch(() => {
          if (live) setResult({ input, upper: values.upper, digests: null });
        });
    const id = window.setTimeout(run, input.length > 20_000 ? 250 : 0);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [client, input, values.upper]);

  const touched = typed !== null || chosen !== null;
  useEffect(() => {
    if (!touched) return;
    const id = window.setTimeout(
      () =>
        writeShared({
          input,
          options: values.upper ? { upper: true } : undefined,
        }),
      300,
    );
    return () => window.clearTimeout(id);
  }, [touched, input, values.upper]);

  const current = input && result ? result : null;
  const stale =
    current !== null &&
    (current.input !== input || current.upper !== values.upper);
  const digests = current?.digests ?? [];
  const failed = current !== null && current.digests === null && !stale;
  const match = stale ? null : findMatch(digests, values.expected);
  const comparing = values.expected.trim() !== "" && digests.length > 0;
  const text = formatDigests(digests);

  const setInput = (value: string) => {
    setChosen((prev) => prev ?? values);
    setTyped(value);
  };

  const setOption = (id: string, value: OptionValue) => {
    setTyped((prev) => prev ?? input);
    setChosen((prev) => ({ ...(prev ?? values), [id]: value }));
  };

  const copyAll = async () => {
    if (text && (await copyText(text))) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  const bytes = utf8Length(input);
  const footer = input ? (
    <>
      <span>
        {bytes.toLocaleString(locale)} {t(locale, "tool.bytes")} · UTF-8
      </span>
      {hasTrailingNewline(input) && (
        <>
          {" · "}
          {pick(locale, COPY.newline)}
          {" · "}
          <button
            type="button"
            onClick={() => setInput(stripTrailingNewlines(input))}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
          >
            {pick(locale, COPY.remove)}
          </button>
        </>
      )}
    </>
  ) : undefined;

  const badge = comparing ? (
    match ? (
      <PaneBadge tone="success">
        {pick(locale, COPY.matchBadge).replace(
          "{name}",
          ALGORITHM_NAMES[match],
        )}
      </PaneBadge>
    ) : stale ? null : (
      <PaneBadge tone="destructive">{pick(locale, COPY.noMatch)}</PaneBadge>
    )
  ) : stale ? (
    <Loader2
      aria-label={t(locale, "tool.working")}
      className="size-3.5 shrink-0 animate-spin text-muted-foreground"
    />
  ) : null;

  return (
    <Frame
      size="split"
      toolbar={
        <OptionRow
          locale={locale}
          options={OPTIONS}
          values={values}
          onChange={setOption}
        />
      }
    >
      <Split>
        <Pane
          label={t(locale, "tool.input")}
          footer={footer}
          actions={
            <>
              <PaneButton
                icon={Wand2}
                label={t(locale, "tool.sample")}
                labelAlways
                className="h-9 sm:h-7"
                disabled={input === SAMPLE}
                onClick={() => setInput(SAMPLE)}
              />
              <PaneButton
                icon={ClipboardPaste}
                label={t(locale, "tool.paste")}
                onClick={async () => {
                  const pasted = await readText();
                  if (pasted !== null) setInput(pasted);
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
            placeholder={t(locale, "tool.inputPlaceholder")}
            aria-label={t(locale, "tool.input")}
            sizing="content"
            autoFocus
          />
        </Pane>
        <Pane
          label={t(locale, "tool.output")}
          badge={badge}
          className="bg-accent/60"
          actions={
            <PaneButton
              icon={copied ? Check : Copy}
              label={
                copied ? t(locale, "tool.copied") : pick(locale, COPY.copyAll)
              }
              disabled={!text || stale}
              onClick={copyAll}
            />
          }
        >
          {failed && <PaneError>{pick(locale, COPY.failed)}</PaneError>}
          {digests.length > 0 ? (
            <KeyValueList
              locale={locale}
              className={cn(stale && "opacity-60")}
              rows={digests.map((digest) => ({
                label: digest.name,
                value: digest.value,
                ...(digest.algorithm === match
                  ? { tone: "success" as const, hint: COPY.matches }
                  : {}),
              }))}
            />
          ) : (
            !failed && (
              <p className="p-3 text-sm text-muted-foreground">
                {input && stale
                  ? t(locale, "tool.working")
                  : t(locale, "tool.emptyOutput")}
              </p>
            )
          )}
        </Pane>
      </Split>
    </Frame>
  );
}
