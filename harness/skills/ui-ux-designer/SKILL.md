---
name: ui-ux-designer
description: Interface design for tools.gokhangunduz.dev — the Panel.tsx chrome, colour tokens and category tints, Tailwind v4 and shadcn/ui, layout that fills the viewport without page scroll, the states every tool owes, both themes and both languages. Load before designing a page or component, judging whether something looks right, or touching globals.css.
---

# UI/UX designer

The goal is a hundred tools that feel like one. A visitor who learned where the
copy button is on one tool should find it in the same place on the next, and
nothing on the page should compete with the input and the output.

**Reasoning tier: high.** Design judgment does not decompose into rules; this
skill can describe what good looks like but not compute it.

## The design language

**Neutral surfaces, coloured by category.** The page is near-monochrome; colour
appears where it carries meaning:

- Every category has a hue: `--cat-encode`, `--cat-data`, `--cat-text`,
  `--cat-crypto`, `--cat-time`, `--cat-network`, `--cat-image` in
  `src/app/globals.css`.
- A tool page, a card or a sidebar group sets the class `cat-<id>`, which points
  `--tint` at its hue. Inside it, badges, active states and focus use the tint:
  `bg-tint`, `text-tint`, `bg-tint/15`, `border-tint/40`.
- Status colours are semantic tokens: `text-destructive`, `text-success`,
  `text-warning`, `text-info`. A `Tone` (`success`, `warning`, `destructive`,
  `muted`) maps to them in the runners.
- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `border-border`. Soft
  shadows (`shadow-soft`, `shadow-lift`), rounded cards (`rounded-xl`), small
  radii inside them.
- Type: Geist Sans for copy, Geist Mono for values. Numbers compared by eye take
  `.tabular`.

**Never a literal colour.** No hex, no `rgb()`, no `bg-[#…]`, no `dark:` variant
that picks a colour by hand. If the token you need is missing, add it to
`globals.css` in both the light and the dark block. `verify/invariants.sh`
rejects a hex colour anywhere else in `src/`.

## The chrome

`src/components/Panel.tsx` is the editor chrome every tool is built from:

| Primitive | For |
|---|---|
| `Frame` | the one bordered frame; `size` = `fill` (stretch to the page), `content` (end where content ends), `split` (two panes with a floor) |
| `Split` | two panes side by side from `md`, stacked below |
| `Pane` | a pane with its own header bar (label, badge, actions) |
| `PaneFooter`, `PaneBadge`, `PaneButton` | the footer line, a small figure, a header action |
| `PaneTextarea` | the input/output text area |
| `PaneError` | the error line (`data-tool-error`), with an optional fix action |
| `KeyValueList` | structured results, a copy button per row |
| `Segmented` | a direction or mode switch |

The runners (`TextTool`, `DualTool`, `FileTool`, `GeneratorTool`) compose these;
a bespoke tool composes them too. A new primitive goes into `Panel.tsx` once two
tools need it — not inline in one.

Components come from shadcn/ui: `npx shadcn@latest add <name>`, then point its
imports at `@/lib/utils`. No second component library.

## Layout

- **The tool page does not scroll; the panes do.** On a desktop viewport the
  frame fills the space under the header and every pane scrolls inside it. A
  page scrollbar on a tool page means a frame is sized wrong or something sits
  outside it that should be a toolbar or a footer.
- On a phone the panes stack, and each keeps a usable minimum height.
- Options sit in the frame's toolbar (`OptionRow`), the primary text option on
  its own row. Nothing floats between the header and the frame.
- Turkish runs 20–30% longer than English. Check labels, buttons and segmented
  controls in Turkish first; a label that only fits in English is broken.

## States every tool owes

1. **Empty** — a placeholder that says what to paste, and a Sample button.
2. **Working** — the previous result stays until the new one resolves; no
   flicker to empty on every keystroke.
3. **Error** — `PaneError` in the visitor's language, pointing at the line and
   column when it can, offering the fix as an action when there is one.
4. **Full** — output that can be copied and downloaded, with the headline or
   footnote carrying the fact the output does not (size, count, expiry).
5. **Huge** — a 5 MB paste still types; the pane scrolls rather than the page.

## Checking a change

In this order, before "done":

1. Light and dark.
2. Turkish and English.
3. A narrow phone (375 px) and a wide desktop, and a laptop height (~800 px)
   for the no-page-scroll rule.
4. Keyboard only: Tab reaches everything, focus is visible (`ring`, `tint`).
5. Empty, error and very large input.

Only then whether it looks good.
