"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SAMPLE = `# Başlık

Bir **kalın**, bir *eğik* ve bir [bağlantı](https://gokhangunduz.dev).

- [x] biten iş
- [ ] bekleyen iş

| Araç | Durum |
|---|---|
| Markdown | ✓ |

> Alıntı satırı.

\`\`\`ts
const total = items.reduce((sum, item) => sum + item.price, 0);
\`\`\`
`;

/**
 * A Markdown editor with the preview beside it.
 *
 * The preview is rendered with the same GitHub dialect as the converter, and
 * the styles are the site's own rather than a prose plugin's — a heading in
 * the preview should look like a heading on this site, not like a different
 * product embedded in it.
 */
export default function Tool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("");
  const [html, setHtml] = useState("");

  useEffect(() => {
    let live = true;
    void (async () => {
      if (!input.trim()) {
        if (live) setHtml("");
        return;
      }
      const { marked } = await import("marked");
      const rendered = await marked.parse(input, { gfm: true });
      if (live) setHtml(rendered);
    })();
    return () => {
      live = false;
    };
  }, [input]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE)}>
          {t(locale, "tool.sample")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!input}
          onClick={() => setInput("")}
        >
          {t(locale, "tool.clear")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t(locale, "tool.input")}
          className="min-h-96"
          autoFocus
        />
        <div
          className="markdown-preview min-h-96 overflow-auto rounded-md border bg-muted/20 px-4 py-3 text-sm"
          // The input is the visitor's own, typed into their own browser, and
          // nothing here is shared with anyone — the same trust model as the
          // rest of the site.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
