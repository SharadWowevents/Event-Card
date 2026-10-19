---
name: Luminescent Precision
colors:
  surface: '#0e131f'
  surface-dim: '#0e131f'
  surface-bright: '#343946'
  surface-container-lowest: '#080e1a'
  surface-container-low: '#161c28'
  surface-container: '#1a202c'
  surface-container-high: '#242a36'
  surface-container-highest: '#2f3542'
  on-surface: '#dde2f3'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dde2f3'
  inverse-on-surface: '#2b303d'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#9699ff'
  on-tertiary-container: '#1d17b2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0e131f'
  on-background: '#dde2f3'
  surface-variant: '#2f3542'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-mono-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system merges the focused, hyper-crafted ethos of modern engineering tools with the electric vibrancy required for world-class live and virtual events. Built for high-leverage event marketers, producers, and engineering-driven teams, the system communicates uncompromising precision, technical authority, and atmospheric energy.

The aesthetic pairs an ultra-deep slate canvas (`#030712` and `#0b0f17`) with focused, luminous spectral accents—transiting smoothly between electric cyan, cerulean, and radiant emerald. Visual layers favor crisp glassmorphism: hairline borders (1px) with subtle ambient edge reflections, translucent surface overlays, and tactile feedback states. Elements never feel decorative without purpose; micro-surfaces maintain high information density, structural hierarchy, and tactile, physics-based responsiveness.

## Colors

The palette establishes an obsidian-grade baseline punctuated by electric neon highlights. 

- **Canvas & Neutrals**: The base surface is anchored in deep cosmic slate (`#030712`), stepped up incrementally to `#0b0f19` for elevated cards, `#111827` for interactive surfaces, and `#1f2937` for structural dividers. Neutral typography scales from pure `#f9fafb` (primary read) down to `#9ca3af` (secondary meta) and `#4b5563` (disabled / muted telemetry).
- **Primary Accent (`#10b981`)**: Radiant emerald conveys conversion, live status, operational health, and successful ticket allocations. It functions with an accompanying sub-surface glow (`rgba(16, 185, 129, 0.15)`).
- **Secondary Accent (`#0ea5e9`)**: Electric cyan drives primary focus, directional links, interactive controls, and analytics trends.
- **Tertiary Accent (`#6366f1`)**: Deep indigo brings depth to high-contrast data visualizer graphs, multi-track timeline ribbons, and VIP tier badges.
- **Border & Glass System**: Outlines use semi-transparent white and cyan tints (`rgba(255, 255, 255, 0.08)` baseline, scaling to `rgba(14, 165, 233, 0.3)` upon hover or active state).

## Typography

The type hierarchy pairs **Plus Jakarta Sans** for expressive, crisp geometric clarity with **JetBrains Mono** for high-density telemetry, stage schedules, and numerical metric readouts.

- Headlines leverage negative tracking (`-0.015em` to `-0.03em`) to mimic editorial-grade craft and razor-sharp executive dashboards.
- Numerical displays, ticket counts, pass codes, timestamps, and capacity meters are rendered exclusively in JetBrains Mono using tabular numbers (`tnum`) to eliminate layout jitter during real-time web-socket updates.
- Body copy retains generous line height (`1.5` to `1.6`) against the dark background to preserve readability and minimize visual fatigue.

## Layout & Spacing

The system runs on a 12-column adaptive fluid grid designed for density without crowding:

- **Desktop (1280px+)**: 12 columns, `1.5rem` (24px) gutters, and a maximum content containment width of 1440px with `2rem` outer margins.
- **Tablet (768px - 1279px)**: 8 columns, `1.25rem` gutters, reflowing split-pane analytics sidebars into tabbed cards or collapsible drawer overlays.
- **Mobile (< 768px)**: 4 columns, `1rem` gutters, and `1rem` edge margins. Complex event cards collapse secondary metrics into bottom sheet disclosures or swipeable micro-carousels.
- **Rhythm**: Internal component spacing adheres strictly to an 8px grid (using `0.25rem` steps for compact badges and data indicators). Card-to-card relationships prefer `space-lg` to create clear visual compartmentalization.

## Elevation & Depth

Visual hierarchy uses luminous optical stacking: translucent dark containers layered above subtle radial gradient light sources.

1. **Base Tier (Ground 0)**: `#030712` non-reflective canvas.
2. **Layer 1 (Card & Section Surfaces)**: `rgba(15, 23, 42, 0.65)` with a backdrop blur of `16px`, supported by a crisp 1px perimeter outline of `rgba(255, 255, 255, 0.07)`.
3. **Layer 2 (Floating Modals & Dropdowns)**: `rgba(17, 24, 39, 0.88)` with backdrop blur of `24px`, bound by a dual border: an inner 1px glow line (`rgba(14, 165, 233, 0.2)`) and an exterior drop shadow (`0 20px 40px -15px rgba(0, 0, 0, 0.7)`).
4. **Interactive Overlays**: Active and hover states trigger radial pseudo-element glows (`radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.08), transparent 80%)`) tracking the user cursor.

## Shapes

The design uses a balanced `rounded-2` geometry (`0.5rem` / 8px core radius). This avoids both the clinical austerity of sharp corners and the excessive playfulness of hyper-rounded pill styling.

- **Primary Cards & Containers**: `1rem` (16px, `rounded-lg`) corner radii with anti-aliased border clipping to maintain clean hairline glass strokes.
- **Controls & Form Inputs**: `0.5rem` (8px) corners providing a compact, technical feel.
- **Badges & Live Indicators**: `0.375rem` (6px) or fully rounded pill styles (`9999px`) reserved exclusively for status chips (e.g., `● LIVE`, `SOLD OUT`).

## Components

### Buttons
- **Primary**: Solid gradient fill (`linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)`) with white text, font weight 600, accompanied by a subtle bottom inset highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.35)`) and external drop glow (`0 0 20px -5px rgba(16, 185, 129, 0.5)`).
- **Secondary (Glass)**: `rgba(255, 255, 255, 0.04)` fill, 1px border `rgba(255, 255, 255, 0.12)`, text `#f9fafb`. Hover scales background to `rgba(255, 255, 255, 0.08)` and border to `rgba(14, 165, 233, 0.4)`.
- **Tertiary / Ghost**: Transparent surface, `#9ca3af` text, transitioning to `#f9fafb` with an under-glow hover state.

### Event Cards (Core Signature Component)
- Composite surface featuring backdrop filter (`blur(16px)`), dual-tone top-edge border (`border-t` with a soft cyan-to-emerald gradient shine), and an integrated badge slot.
- Internal layout partitions the dynamic date block (JetBrains Mono), session title (Jakarta Sans 600), speaker avatar stack, and live capacity graph.

### Chips & Status Badges
- High-contrast micro-surfaces: `rgba(16, 185, 129, 0.1)` fill with solid `#10b981` typography and a pulsing 6px radial dot for active states.
- Monospace styling (`label-mono-xs`) formatted in uppercase with `0.06em` letter spacing.

### Inputs & Form Fields
- Surface background `#0b0f19` recessed with an inner border `rgba(255, 255, 255, 0.08)`.
- Focus state brings a sharp 1px border ring in `#0ea5e9` accompanied by an external shadow ring (`0 0 0 3px rgba(14, 165, 233, 0.15)`). Placeholder text set in `#4b5563`.

### Checkboxes & Radios
- Square-rounded (checkbox) and circular (radio) controls with a recessed `#111827` base.
- Checked state transitions instantly with an emerald pop (`#10b981`) and a high-contrast slate checkmark icon (`#030712`).

### High-Density Metric Displays
- Compact metric blocks featuring secondary label (`label-mono-xs`), primary numerical readout (Jakarta Sans Bold, tabular figures), and integrated sparkline or delta pill (`+14.2%` emerald / `-2.1%` rose).
