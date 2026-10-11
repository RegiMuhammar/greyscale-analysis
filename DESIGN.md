# DESIGN.md: GreyScale Analyser

Direction source: the owner asked to follow the visual language of netraruntime.com (2026-10-11).
This file translates that reference into GreyScale Analyser's own content. It is a reference, not a clone:
the structure is kept, every claim and visual is replaced with this product's real data.

## Identity

- Product: browser tool that estimates textile colour-fastness grade (ISO 105-A03 style, 5 to 1) from a before/after photo pair.
- Audience: textile QC staff, lab technicians, and textile students. They read numbers for a living.
- Personality: calm, precise, honest about limits. A measuring instrument, not a marketing site.

## Palette

- Canvas: white `#FFFFFF`. Panels: neutral-50 `#FAFAFA` and neutral-100 `#F5F5F5`.
- Text: neutral-950 `#0A0A0A` for headings and body, neutral-600 `#525252` for secondary text (7.8:1 on white). Nothing lighter than neutral-600 is used for text.
- Lines: neutral-200 `#E5E5E5` for dividers, neutral-950 for the active marker.
- One accent: orange-700 `#C2410C` (5.18:1 on white). Used only for the measured grade reading. It marks the one number the user came for.
- Reason: the product's subject is grey. A neutral canvas keeps the sample colours and grey patches as the only colour on the page, and light neutral backgrounds match how fabric is judged visually.

## Typography

- Display: Bricolage Grotesque, weight 500, tight tracking. Taken from the reference; its slightly irregular grotesque shapes keep a neutral page from feeling sterile.
- Body: Inter (already used by the workspace), for continuity between landing and app.
- Readings: IBM Plex Mono, small sizes only, tabular numbers. Used for measured values and formulas, never for headings.

## Shape and depth

- Radius: panels 20px, cards 12px, buttons 8px. Never pill.
- Shadow: one layered shadow, only on the live demo card in the hero, because it is the product window resting on the panel.
- No glass, no full-page glow, no background grid.
- Hero optical sensor visual: 6-card array (2-column grid) with animated mesh gradients in primary `#1493ff` and complementary hues (amber `#ff8814`, coral `#f43f5e`, emerald `#10b981`, ochre `#f59e0b`, violet `#8b5cf6`) with grain noise and blur, positioned above hero stats. Serves as visual representation of the optical sensor channels across the 400-700 nm D65 spectrum.

## Identity motif

- Paired grey square patches, taken from the ISO grey scale and echoing the square blocks in the logo. Repeated in the scale strip, the demo card, and the final call to action.

## Dials

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

- ENERGY 2: large display headline and generous whitespace, but no decoration.
- RHYTHM 2: consistent spacing with a few compositional breaks (split hero, tabbed steps, bordered spec grid, two-column limits, split FAQ, dark closing band).
- MOTION 1: hover, tab and accordion state changes only. No scroll animation, no loops.

## Content rules

- No numbers without a source. Every figure on the landing page comes from the code (thresholds, formulas, limits) or is computed live from the sample photos in the repo.
- No partner logos, no testimonials, no community section: the product has none.
