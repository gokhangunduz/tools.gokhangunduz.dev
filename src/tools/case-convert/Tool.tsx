"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardPaste, Copy, Eraser, Wand2 } from "lucide-react";
import { pick, t, type Locale } from "@/i18n";
import { Frame, Pane, PaneButton, PaneTextarea } from "@/components/Panel";
import OptionRow from "@/components/OptionRow";
import { copyText, readText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { convertCase } from "./logic";
import { OPTIONS, PLACEHOLDER, SAMPLE, STYLES } from "./spec";
import { useLinkState } from "./use-link-state";

/**
 * Every style at once, one row each, because the question is usually "which
 * of these do I want" rather than "convert to X".
 */
export default function Tool({ locale }: { locale: Locale }) {
  const { input, values, setInput, setOption } = useLinkState(OPTIONS);
  const [copied, setCopied] = useState<string | null>(null);

  const results = useMemo(
    () =>
      STYLES.map((style) => ({
        ...style,
        value: convertCase(
          input,
          style.id,
          values.turkish !== false,
          values.ascii !== false,
        ),
      })),
    [input, values],
  );

  const copy = async (id: string, value: string) => {
    if (!value || !(await copyText(value))) return;
    setCopied(id);
    window.setTimeout(
      () => setCopied((current) => (current === id ? null : current)),
      1400,
    );
  };

  return (
    <Frame
      size="content"
      toolbar={
        <>
          <span />
          <OptionRow
            locale={locale}
            options={OPTIONS}
            values={values}
            onChange={setOption}
            sharing
          />
        </>
      }
    >
      <Pane
        label={t(locale, "tool.input")}
        className="shrink-0 border-b"
        actions={
          <>
            <PaneButton
              icon={Wand2}
              label={t(locale, "tool.sample")}
              labelAlways
              disabled={input === SAMPLE}
              onClick={() => setInput(SAMPLE)}
            />
            <PaneButton
              icon={ClipboardPaste}
              label={t(locale, "tool.paste")}
              onClick={async () => {
                const text = await readText();
                if (text !== null) setInput(text);
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
          placeholder={pick(locale, PLACEHOLDER)}
          aria-label={t(locale, "tool.input")}
          sizing="content"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoFocus
          className="max-h-[7.75rem] min-h-[5.25rem] font-mono"
        />
      </Pane>
      <Pane label={t(locale, "tool.output")} className="bg-accent/60">
        <ul className="divide-y divide-border/60">
          {results.map((row) => {
            const name = pick(locale, row.label);
            const done = copied === row.id;
            const copyLabel = done
              ? t(locale, "tool.copied")
              : `${t(locale, "tool.copy")}: ${name}`;
            return (
              <li
                key={row.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 px-3 py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto]"
              >
                <span className="col-start-1 row-start-1 pt-0.5 text-xs text-muted-foreground">
                  {name}
                </span>
                <span
                  className={cn(
                    "col-start-1 row-start-2 min-w-0 whitespace-pre-wrap font-mono text-sm [overflow-wrap:anywhere] sm:col-start-2 sm:row-start-1",
                    !row.value && "text-muted-foreground/60",
                  )}
                >
                  {row.value || "—"}
                </span>
                <button
                  type="button"
                  title={copyLabel}
                  aria-label={copyLabel}
                  disabled={!row.value}
                  onClick={() => copy(row.id, row.value)}
                  className="col-start-2 row-span-2 row-start-1 flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 sm:col-start-3 sm:row-span-1"
                >
                  {done ? (
                    <Check className="size-3.5 text-success" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Pane>
    </Frame>
  );
}
