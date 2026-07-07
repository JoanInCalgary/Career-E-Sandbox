---
name: Editorial Sandbox
colors:
  background: '#FFFFFF'
  background-alt: '#FAFAFA'
  surface: '#FFFFFF'
  surface-hover: '#F5F5F5'
  border: '#E8E8E8'
  border-subtle: '#F0F0F0'
  text-primary: '#111111'
  text-secondary: '#555555'
  text-muted: '#888888'
  inverse-surface: '#111111'
  inverse-on-surface: '#FFFFFF'
  accent: '#FF5500'
  accent-hover: '#DD4400'
  data-blue: '#0055FF'
  positive-green: '#00BB00'
  negative-red: '#EE0000'
  favourite-gold: '#FFAA00'
typography:
  display:
    fontFamily: Instrument Serif
    fontWeight: '400'
    lineHeight: '1.15'
    note: Used for h1/h2 only — big editorial headings, no faux-bold.
  heading:
    fontFamily: Geist
    fontWeight: '700'
    lineHeight: '1.25'
    note: Used for h3–h6.
  body:
    fontFamily: Geist
    fontSize: 15px
    lineHeight: '1.6'
  data-mono:
    fontFamily: Geist Mono
    note: Used for stats, match percentages, salary figures, eyebrow labels, and codes.
rounded:
  input: 0.25rem
  card-sm: 0.5rem
  card: 0.75rem
  card-lg: 1rem
  pill: 9999px
spacing:
  base-unit: 4px
  section-padding-y: 80px
  section-padding-x: 24px
  card-padding: 24px
  gutter: 16px
---

## Brand & Style

The visual identity is **Editorial Modern** — a clean, high-contrast black/white/orange system built around Instrument Serif display type and generous whitespace, borrowed directly from the marketing homepage (`app/page.tsx`). Every page in the app — not just the landing page — should read as part of the same product. The homepage is the canonical reference: when its styling changes, every other screen (dashboard, search, results, account pages, career detail) should be updated to match, not maintained as a separate theme.

The tone balances the seriousness of career decision-making with the platform's "sandbox" philosophy: structured, confident typography paired with a single, energetic accent color used sparingly for calls to action.

## Colors

The palette is intentionally near-monochrome. Backgrounds are pure white (`#FFFFFF`), with alternating light-gray sections (`#FAFAFA`) used only to separate horizontal bands on longer pages (see the homepage's "How It Works" / "Your Results" sections). Text runs on a three-step gray scale: `#111111` for headings and primary content, `#555555` for body copy, and `#888888` for muted labels, captions, and secondary metadata. Borders are `#E8E8E8` everywhere (`#F0F0F0` for very subtle internal dividers like card footers).

`#FF5500` ("signal orange") is the **only** brand accent and should be the single color used for primary buttons, active nav/tab states, links, focus rings, and hover accents across the entire app — including pages that historically used a different accent (a burnt-orange/brown `#C05E28` on the dashboard/account pages, and a blue `#1a56db` on the career detail page have both been retired in favor of this one). Its hover/pressed state is `#DD4400`.

A small set of functional colors exists on top of the neutral scale purely to encode data, not brand: `#0055FF` (blue) for match-percentage badges and other data highlights, `#00BB00` (green) for "pros"/positive market signals, `#EE0000` (red) for "cons"/flagged or negative signals, and `#FFAA00` (gold) for favourites/starred items. The career-detail page's quartile ranking system (top/2nd/3rd/bottom quartile bars and badges) is the one place with its own 4-color semantic scale, since it encodes a fixed ranking tier rather than brand or simple positive/negative meaning — leave that scale as-is even as other colors are unified.

Footers and other full-bleed dark sections use `#111111` as a solid inverse surface with white text.

## Typography

Big editorial headings (`h1`, `h2`) use **Instrument Serif** at regular weight (400) — never bold, the serif itself carries the weight. Everything smaller (`h3`–`h6`) drops to **Geist** at bold (700). Body copy is Geist at 15px with 1.6 line-height for comfortable reading. **Geist Mono** is reserved for anything data-flavored: match percentages, salary ranges, step numbers, eyebrow/kicker labels (uppercase, wide tracking), and eyebrow-style category tags.

## Layout & Spacing

Marketing/content sections use generous vertical padding (~80px) with a centered max-width container (`max-w-3xl` for narrow copy, `max-w-5xl` for grids). App/product screens (dashboard, search, career detail) use a tighter, denser layout appropriate to working screens, but should still inherit the same neutral chrome, card shapes, and accent color as the homepage rather than a separate visual system. An 8px-ish rhythm governs padding/margin increments.

## Elevation & Depth

Depth comes from borders first, shadows second. Cards default to a 1px `#E8E8E8` border with a very subtle shadow (`0 1px 3px rgba(0,0,0,0.05)`); hovering a clickable card increases the shadow (`shadow-md`) and/or swaps the border to `#111111` rather than deepening the shadow dramatically. Avoid heavy drop shadows — the aesthetic is flat and paper-like.

## Shapes

- **Inputs, small buttons:** small radius (`rounded`, ~0.25rem).
- **Cards, panels, sections:** `rounded-xl`–`rounded-2xl` (0.75–1rem).
- **Pills, tags, chips, primary CTAs, nav toggles:** fully rounded (`rounded-full`).

## Components

- **Buttons:** Primary actions are solid `#FF5500` with white text, usually pill-shaped, hover to `#DD4400`. Secondary/ghost buttons are white with an `#E8E8E8` border, hovering to a `#111111` border.
- **Nav bars:** White background, `#E8E8E8` bottom border, sticky, subtle shadow. Active link gets a 2px `#111111` underline; inactive links are `#888888` fading to `#111111` on hover.
- **Cards (career/result cards):** White surface, `#E8E8E8` border, optional colored top accent bar (`#111111` for primary/best-match, `#EE0000` for flagged). Match-percent badge is a solid `#0055FF` pill with white Geist Mono text.
- **Pros/Cons lists:** Green `+ / #00BB00` for pros, red `– / #EE0000` for cons — consistent everywhere this pattern appears (search results, career detail).
- **Forms:** Inputs use a 1px `#E8E8E8` border, focus state switches the border to `#FF5500`. Toggle pills (single-select groups) fill `#FF5500` with white text when active, otherwise white with `#E8E8E8` border.
- **Badges/chips:** Small pill-shaped, uppercase, wide letter-tracking, Geist Mono for numeric ones (match %, quartile scores).
