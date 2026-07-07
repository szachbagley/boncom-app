# Boncom Estimates — Design System

A calm, editorial, professional design system for **Boncom Estimates**, an internal
cost-estimate tool for **Boncom**, a purpose-driven creative advertising agency
("good work for good causes"). The system is minimal and confident: white surfaces,
lots of whitespace, sharp (never rounded) edges, no shadows, one typeface, and a
restrained palette that leans on navy for structure and cyan for interaction.

## Sources

This system was built **from brand guidelines only** — no codebase, Figma file, or
logo assets were provided. Brand tokens (colors, type, shape rules, voice) were
supplied directly by the requester, sourced from **boncom.com**. If you have access
to the following, add them and re-run:

- The Boncom marketing site (boncom.com) for logo files and imagery.
- Any existing Estimates product code or Figma for exact screen structure.

> **No logo file was supplied.** Per policy we did **not** draw or reconstruct a
> Boncom mark. Wherever a logo would go, the product name is set in type — `Boncom`
> in weight 700 + `Estimates` in weight 300, navy. Replace with the real mark when
> available (see `guidelines/brand-wordmark.card.html`).

---

## Components

Reusable UI primitives (React, styled entirely via the CSS custom properties). Import
from the compiled bundle namespace `window.BoncomEstimatesDesignSystem_54c230`.

- **Button** (`components/core/`) — sharp, flat, uppercase action button. Variants: primary (navy), accent (cyan), emphasis (orange), secondary, ghost, danger.
- **IconButton** (`components/core/`) — square flat button for a single icon.
- **SectionLabel** (`components/core/`) — spaced uppercase micro-heading; a signature brand device.
- **Card** (`components/core/`) — flat, hairline-bordered container; optional cyan top rule.
- **Input** (`components/forms/`) — single-line field, cyan focus border, `$`/unit adornments.
- **Textarea** (`components/forms/`) — multi-line field matching Input.
- **Select** (`components/forms/`) — native select with navy chevron.
- **Checkbox** (`components/forms/`) — square box, cyan fill + navy tick.
- **Badge** (`components/feedback/`) — flat uppercase status/label chip (draft/sent/approved/rejected/revised + tones).
- **Dialog** (`components/feedback/`) — centered modal over a navy scrim, cyan top rule.
- **Tabs** (`components/navigation/`) — underline tab row with an active cyan rule.

### Intentional additions
This is a from-scratch, guidelines-only system, so the component set is authored to
the needs of an estimate tool (list + editor + forms). Nothing here overrides a
pre-existing source inventory because none was provided.

## UI kit

- **`ui_kits/estimates/`** — the Boncom Estimates app: an interactive click-through
  with a navy sidebar shell, an estimates **Dashboard** (stat strip, filter tabs,
  sortable-looking table with status badges), an **EstimateEditor** (sectioned
  line-item table + summary rail with live contingency toggle), and a **New estimate**
  dialog flow. Composes the primitives above; does not re-implement them.

---

## CONTENT FUNDAMENTALS

**Tone:** minimal, confident, trustworthy, understated. Never playful, never flashy.
The product speaks like a competent producer — it states facts and gets out of the way.

- **Person:** neutral/system voice. State what happened ("Estimate sent to Riverbend
  Foundation.") rather than addressing the user with hype.
- **Casing:** Sentence case for body and headings. **UPPERCASE with wide tracking**
  for labels, nav, section headers, and button text only.
- **Numbers & money:** plain, tabular, no decorative embellishment. `$48,200`, not
  "$48.2k 💰". Use `tabular-nums` in tables.
- **Emoji:** **none.** Not in UI, not in copy.
- **Exclamation / error voice:** avoid exclamation marks and cute error copy. Prefer
  "Already in use" over "Oops! That code is taken."
- **Examples we say:** "Ready to send when you are." · "Two-day shoot, one revision
  round." · "Awaiting response." **We don't say:** "🎉 Woohoo!" · "Supercharge your
  workflow." (See `guidelines/brand-voice.card.html`.)

## VISUAL FOUNDATIONS

- **Color:** White (`#FFFFFF`) surfaces. Near-black ink (`#292A2C`) for body text.
  **Navy `#002042`** for headings, structure, sidebar, and the primary action.
  **Cyan `#65C6D9`** for links, active states, focus, and accent rules. **Orange
  `#FC4F2C`** is a rare pop / warning only. A cool blue-gray neutral ramp
  (`#F6F8FA → #6B7A87`) handles fills, borders, and secondary text — **no warm/earthy
  tones anywhere.** Semantic status uses a muted green `#3E8E6E` (success) and muted
  red `#C24634` (danger), with orange reserved for warnings.
- **Type:** **One family only — Open Sans** (Arial fallback). Hierarchy comes from
  **weight and size, never a second typeface.** Hero/display = 300 with tight tracking
  (`-1.4px`); headings = 300/600 navy; subheads = 600; body = 400, 18px / ~30px line
  height; section labels = 700, 14px, **+5.6px** tracking, uppercase; nav labels = 700,
  +2.3px, uppercase. Loaded from Google Fonts (see font note below).
- **Spacing:** 4px base scale (`--space-1`…`--space-10`). Generous, editorial
  whitespace; content sits in comfortable columns, not dense grids.
- **Shape:** **`border-radius: 0` everywhere.** Corners are always sharp — buttons,
  cards, inputs, badges, dialogs, avatars.
- **Borders:** hairline `1px` in cool gray (`--border-hairline` / `--border-strong`).
  Structure and separation come from borders + whitespace, not fills.
- **Shadows:** **none, anywhere.** Depth is expressed with borders and a dim navy
  scrim on modals. There is a `--shadow-none` token to make this explicit.
- **Emphasis device:** a **3px cyan top rule** on a card or dialog signals importance
  (`Card accent`, `Dialog`). Use sparingly.
- **Backgrounds:** flat white or `--surface-subtle` (`#F6F8FA`) fills only. **No
  gradients, no textures, no imagery washes, no hand-drawn illustration.**
- **Imagery:** none supplied. If added later, keep it cool/neutral and editorial —
  never warm, never grainy filters. Ask before introducing imagery.
- **Motion:** calm. Fades and short color transitions (`120–200ms`,
  `cubic-bezier(0.4,0,0.2,1)`). **No bounce, no spring, no scale-pop.**
- **Hover states:** navy actions darken slightly (`--action-primary-hover`); cyan
  actions go to a deeper cyan; ghost/secondary get a faint `--surface-hover` fill;
  table rows tint to `--surface-subtle`; links shift cyan → navy.
- **Press / focus:** focus is shown as a **cyan border** (not a glow ring). No
  shrink-on-press; the brand stays still and composed.
- **Cards:** flat, white, `1px` hairline border, radius 0, no shadow. Optional cyan
  top rule for emphasis. That is the entire card treatment — resist adding depth.
- **Transparency / blur:** essentially unused. The only translucency is the modal
  scrim (`rgba(0,32,66,0.42)`) and subtle sidebar nav hover tints. No glassmorphism.
- **Layout rules:** fixed navy sidebar (232px) + a top bar with search and primary
  action; content centered in a ~1120px max column with 32px gutters.

## ICONOGRAPHY

- **Set:** **Lucide** (https://lucide.dev), loaded from CDN
  (`unpkg.com/lucide`). Line icons, ~1.75px stroke, **square line caps** to echo the
  sharp-cornered brand. This is a **substitution** — no icon assets were provided by
  the brand; Lucide is the closest match to a minimal, editorial line-icon voice.
  **Flag:** replace with Boncom's own icon set if one exists.
- **Usage:** icons are functional, not decorative — nav items, row actions, search,
  send/print/export, chevrons. Rendered in navy or muted gray; cyan when active.
- **Color/size:** 16–18px in UI; stroke color follows text color of the context.
- **Emoji:** never used as icons or anywhere else.
- **Unicode glyphs:** a middot (`·`) is used as a soft separator in labels; otherwise
  avoid glyph-as-icon.

---

## Foundations (Design System tab cards)

- **Colors** — Primary & Brand, Neutrals, Status (`guidelines/colors-*.card.html`)
- **Type** — Display & Hero, Headings & Subheads, Body & Labels (`guidelines/type-*.card.html`)
- **Spacing** — Spacing Scale, Shape & Shadow (`guidelines/spacing-scale`, `guidelines/shape`)
- **Brand** — Wordmark, Voice (`guidelines/brand-*.card.html`)

## Index / manifest

- `styles.css` — global entry point (consumers link this). `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `components/` — `core/`, `forms/`, `feedback/`, `navigation/` (each: `.jsx` + `.d.ts` + `.prompt.md` + one `@dsCard` HTML).
- `guidelines/` — foundation specimen cards.
- `ui_kits/estimates/` — the Estimates app (`index.html`, `AppShell.jsx`, `Dashboard.jsx`, `EstimateEditor.jsx`, `data.js`).
- `SKILL.md` — Agent-Skills-compatible entry point.
- Generated (do not edit): `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json`.

## Font note

Open Sans is loaded via the Google Fonts CSS API (`tokens/fonts.css`), which resolves
to the correct `@font-face` rules at runtime. If you need the webfont binaries shipped
locally (offline use), drop `.woff2` files in `assets/fonts/` and replace the `@import`
with explicit `@font-face` rules. **Open Sans is the specified brand family — no
substitution was made.**
