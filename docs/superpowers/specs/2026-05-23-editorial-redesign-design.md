# Editorial Redesign — Echo Novel Site

**Date:** 2026-05-23
**Status:** Approved

## Goal

Replace the current "terminal × literary serif" UI with a modern editorial / newspaper aesthetic. Adopt Shiki for code highlighting with explicit light / dark themes. Keep the Echo terminal motif as a small supporting element, not the dominant visual.

## Approved Choices

- **Visual style:** Editorial / newspaper (option B from style direction)
- **Palette:** Modern restrained — white `#fff`, ink `#0a0a0a`, vermilion accent `#c92a2a` (option C from palette)
- **Dark mode:** Ink `#0e0e0c` ground + cream `#ede7d3` text + brightened vermilion `#ff5757`
- **Hero treatment:** Two-column hybrid — editorial left, miniature terminal right (option B from hero treatment)
- **Chapter page:** Editorial Light — kicker, headline, epigraph, ornament, drop cap (option B from chapter decoration)
- **Code highlighting:** Shiki with `github-light` + `github-dark-dimmed`

## Design

### 1. Color tokens

Light theme (default):

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#ffffff` | page ground |
| `--bg-soft` | `#fafaf6` | secondary surfaces (footer, code soft) |
| `--bg-elev` | `#ffffff` | cards, terminal mini |
| `--fg` | `#0a0a0a` | body text, headlines |
| `--fg-soft` | `#2a2a2a` | lede / secondary copy |
| `--fg-mute` | `#6a6a6a` | byline, meta, mute labels |
| `--rule` | `#0a0a0a` | double rules, hard divides |
| `--border` | `#e5e2da` | hairline borders |
| `--accent` | `#c92a2a` | kicker, accent details, links on hover |
| `--accent-soft` | `rgba(201,42,42,0.08)` | hover backgrounds |

Dark theme:

| Token | Value |
| --- | --- |
| `--bg` | `#0e0e0c` |
| `--bg-soft` | `#16140f` |
| `--bg-elev` | `#1a1714` |
| `--fg` | `#ede7d3` |
| `--fg-soft` | `#c8c0aa` |
| `--fg-mute` | `#8a8064` |
| `--rule` | `#ede7d3` |
| `--border` | `#2a2520` |
| `--accent` | `#ff5757` |
| `--accent-soft` | `rgba(255,87,87,0.10)` |

### 2. Typography

- **Body (serif):** Noto Serif SC (Chinese) + Source Serif 4 (Latin). Loaded from Google Fonts.
- **Mono:** JetBrains Mono — used for kicker, byline, masthead, meta, code.
- Weights: serif 400 (body), 600 (subheads), 700 (headlines). Mono 400 / 500.
- Letter-spacing: kicker / byline use `0.16em–0.22em`; headlines use `-0.005em`.
- Body line-height: 1.85; serif `font-feature-settings: 'kern','liga','palt'`.

### 3. Layout grid

- Page max width: `64rem` for shell, `75ch` for reading body.
- Container side padding: `1.5rem` desktop, `1.1rem` mobile.
- Hero: two columns `1.4fr 1fr` desktop; stacks vertically below `900px`.

### 4. Masthead (Nav)

Replace `$ echo▌` brand with newspaper masthead:

```
ECHO  ─  Vol. 1                        Ch. ▸ | 灯/夜
```

- Brand: serif 700 small caps `ECHO`, separator `─`, mono volume label `Vol. 1`.
- Sticky on scroll, backdrop blur kept.
- Theme toggle: text button `灯` / `夜` (mono, uppercase).
- Chapter-page nav adds a `目录` link.

### 5. Hero (homepage)

Left column:

- Top: full-width `chap-rule` (double rule with mono label `ECHO · VOL. 1` and accent `● ISSUE 01 · 2026`).
- Kicker (mono, vermilion uppercase): `A NOVEL · 35 CHAPTERS`.
- Headline (serif 700, ~3.5rem desktop): 三行
  > 在二〇一〇年的<br/>那个深夜，<br/>他遇见了 Echo。
- Lede (serif 400, ~1.05rem, max 36em): existing intro copy.
- CTA row: solid vermilion button `从序章开始 ▸` (white text) + ghost mono link `查看目录 ↓`.
- Meta dl row (mono): 章节 / 字数 / 时代.

Right column — **mini terminal** (not the windowed mock):

- Small `<aside>` with monospace lines, 1px border using `--border`, accent-tinted prompts.
- Content: 4–5 lines, e.g.
  ```
  $ cat /opt/echo/README
  This is yours now.
  $ ./echo
  > hello?
  I'm here.
  ```
- No traffic-light buttons, no fake title bar. Just text + thin border + light backdrop.

### 6. Chapter list (homepage section)

- Header: `> 目录` (serif 600, 1.6rem) + mono sub `36 chapters · 由序章入`.
- Row layout: `grid-template-columns: 3.2rem 1fr auto`.
  - Number cell: mono, vermilion, tabular-nums, e.g. `00`, `01`.
  - Title cell: serif, ink, `第N章 · 子题`.
  - Word count cell: mono, mute, `8.5k 字`.
- Hover: row background `--accent-soft`, plus a 2px vermilion left bar fading in.

### 7. Chapter page

Structure (top to bottom):

1. Sticky masthead.
2. Top reading progress bar — 1px, vermilion fill.
3. `<header>` block, centered:
   - Double rule (`chap-rule`): `ECHO / VOL. 1` ↔ accent `● Ch. 06 · 从零搭建`.
   - Kicker mono: `Chapter Six` (English ordinal; auto-derived).
   - Headline serif 700, ~2.2rem.
   - Meta mono: `3,242 字 · 约 9 分钟`.
   - Epigraph block: italic serif, vermilion 2px left border, indented; sourced from `epigraph` frontmatter or auto-derived (see §10).
   - Ornament line: centered mono, `— ECHO —`, letter-spaced.
4. `<article class="prose">`:
   - First paragraph gets `.has-drop-cap`: `::first-letter` 3em float, bold, 0.1em margins.
   - Subsequent paragraphs: 2em first-line indent, line-height 1.85.
   - HR rendered as a short centered vermilion 1px line, 6rem wide.
5. Pager block (`上一章` / `下一章`) — mono labels, serif titles, hairline border boxes.
6. Footer back-link mono.

### 8. Footer (homepage)

- Mono small text.
- Two rows:
  - `$ echo --done  ──── — fin —`
  - Three colophon lines: typeface credit, source repo link, copyright.

### 9. Code blocks (Shiki)

Astro config:

```js
markdown: {
  shikiConfig: {
    themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    defaultColor: false,
  },
}
```

CSS (in `global.css`):

```css
.shiki, .shiki span { color: var(--shiki-light); background-color: var(--shiki-light-bg); }
html[data-theme='dark'] .shiki,
html[data-theme='dark'] .shiki span { color: var(--shiki-dark); background-color: var(--shiki-dark-bg); }
.prose pre.shiki {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.9rem 1.1rem;
  font-size: 0.86em;
  line-height: 1.6;
  overflow-x: auto;
  text-indent: 0;
}
```

`defaultColor: false` makes Shiki emit CSS variables instead of inline colors so light/dark swap via `data-theme`.

### 10. Epigraph extraction

Add `epigraph` (optional string) to `content.config.ts` chapter schema.

Automation script `scripts/extract-epigraphs.mjs`:

1. Iterate `src/content/chapters/*.md`.
2. Parse frontmatter; skip if `epigraph` already present.
3. Walk body lines for the first paragraph containing a Chinese dialogue pattern (`"…"` or `「…」`). Prefer the first quoted utterance; if it is < 60 字, use it. Otherwise try the next.
4. If found, write `epigraph: "…"` back into the file's frontmatter.
5. If none found in first ~40 lines, leave it empty.

In `[slug].astro`, render the epigraph block only when present.

### 11. Drop cap

CSS-only:

```css
.prose p.has-drop-cap::first-letter {
  font-size: 3.2em;
  font-weight: 700;
  float: left;
  line-height: 0.85;
  margin: 0.1em 0.12em 0 0;
}
```

Apply `.has-drop-cap` via an Astro rehype plugin that adds the class to the article's first paragraph (skipping the epigraph block, which is rendered separately by the layout, not from markdown).

If `::first-letter` lands on a half-width quotation mark (`"`), wrap it: the rehype plugin replaces a leading `"` with `<span class="dc-quote">"</span>` so the drop cap applies to the next character. Same for `「`.

### 12. Theme toggling

- Keep the existing `localStorage` + `data-theme` bootstrap script.
- Update the toggle button: text `灯` / `夜` (mono, uppercase letter-spacing). No SVG icons.
- Default mode follows `prefers-color-scheme`.

### 13. Out of scope (for this redesign)

- Pull-quote support (option C from chapter decoration was rejected).
- Multi-column body layout.
- Per-chapter cover art.
- Search / TOC drawer (chapter pager already provides navigation).

## Affected files

| Path | Change |
| --- | --- |
| `src/styles/global.css` | Full rewrite with new tokens + editorial typography rules. |
| `src/layouts/Base.astro` | Font links updated to Source Serif 4 + Noto Serif SC + JetBrains Mono; progress bar color uses `--accent`. |
| `src/components/Nav.astro` | Masthead rewrite. |
| `src/components/Terminal.astro` | Reduced to mini terminal block, no chrome. |
| `src/components/ChapterList.astro` | New row layout + accent numbers + hover bar. |
| `src/pages/index.astro` | Hero rewrite to two-column editorial; new copy structure. |
| `src/pages/chapters/[slug].astro` | Add kicker, epigraph block, ornament, drop-cap class trigger, pager restyle. |
| `src/content.config.ts` | Add optional `epigraph: z.string().optional()` to chapter schema. |
| `astro.config.mjs` | Shiki themes config; add rehype plugin for drop-cap class. |
| `src/lib/rehype-drop-cap.mjs` | New: add `has-drop-cap` to first paragraph; wrap leading quotes. |
| `scripts/extract-epigraphs.mjs` | New: scan chapters, write `epigraph` frontmatter. |
| `src/content/chapters/*.md` | Frontmatter augmented with `epigraph` (where extractable). |
| `public/favicon.svg` | Updated to vermilion accent square. |
| `README.md` | Update typography/design section. |

## Verification

1. `bun run build` — must succeed with 37 pages.
2. Local `bun run dev` walk-through:
   - Homepage hero renders with masthead, headline, mini terminal aligned right.
   - Chapter list rows have vermilion numbers and hover bar.
   - Chapter page: kicker / headline / epigraph (where present) / ornament / drop cap / shiki code block.
   - Toggle 灯/夜 swaps theme; code blocks recolor via shiki CSS variables.
   - View transitions still smooth between chapters.
3. Visit ≥ 3 chapters with code blocks and ≥ 3 chapters without to verify epigraph extraction quality.
4. Deploy to Cloudflare Workers via `bun run deploy`. URL: `https://echo-novel.innei-work.workers.dev`.
5. Commit to GitHub and push.
