---
name: Terminal Alpha Quant
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#56e5a9'
  on-tertiary: '#003824'
  tertiary-container: '#30c88f'
  on-tertiary-container: '#004e34'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  numeric-xl:
    fontFamily: JetBrains Mono
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.03em
  numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.02em
  numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 0.75rem
  margin-desktop: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an institutional-grade, computational trading and machine learning intelligence interface built specifically for Indian equity markets (NSE & BSE). It merges the technical rigour of institutional Bloomberg-grade quantitative terminals with the sleek, polished ergonomics of modern quantitative research dashboards.

### Audience & Mood
The primary audience consists of algorithmic traders, equity research analysts, financial engineers, and academic researchers evaluating machine learning predictive signals. The system projects unimpeachable precision, rigorous academic integrity, and operational focus. Visual excess is systematically eliminated to minimize cognitive fatigue during multi-hour market monitoring.

### Visual Style
- **Aesthetic Movement:** Deep Dark Precision Terminal & High-Density Modern Fintech.
- **Architectural Foundation:** Low-reflectance obsidian surfaces, high-contrast numeric micro-hierarchies, hairline division structures (0.5px to 1px), and luminous chromatic signals reserved strictly for market telemetry, state shifts, and ML confidence levels.
- **Academic Credibility:** Highlighting algorithmic provenance, inference confidence intervals, backtest metrics, and synthetic/sample telemetry labels with disciplined visual taxonomy.

## Colors

The palette is engineered around dark-field luminescence and instant visual triage. Every hex value serves an exact informational function:

### Surface & Environment
- **Canvas Base / Core Ground:** `#0B0F19` (Obsidian Deep) — Absorptive base preventing eye strain.
- **Canvas Elevated / Secondary Canvas:** `#0D131F` (Midnight Carbon) — Structural contrast for nested sidebars and command panels.
- **Surface Tier 1 (Cards, Modules):** `#131B2E` (Slate Navy Base) — The primary layer for data visualizations and analytic modules.
- **Surface Tier 2 (Hover, Modals, Popovers):** `#182238` (Active Slate) — Interactive target elevation.
- **Hairline Dividers & Outlines:** `#1E293B` (Structural Slate) to `#22314E` (Border Highlight).

### Key Accents & Analytics
- **Primary / Active Accent (`#38BDF8` - Electric Cyan):** Active tabs, primary control focus, interactive telemetry nodes, crosshair reticles, and real-time tick pulses.
- **Secondary / ML Predictive Vector (`#6366F1` - Financial Indigo):** AI model inferences, projected trend cones, probability distribution boundaries, and algorithmic badges.
- **Positive / Bullish / Profit (`#10B981` emerald, accented by `#34D399`):** Upward delta ticks, positive book depth, long positions, and outperforming metrics.
- **Negative / Bearish / Loss (`#EF4444` crimson, accented by `#F43F5E`):** Downward delta ticks, liquidation thresholds, short positions, and model underperformance warnings.
- **Warning / Alert / Model Uncertainty (`#F59E0B` amber gold):** Volatility band breaches, low-confidence ML estimates, circuit limit warnings, and test dataset indicators.

### Text & Neutral Ramp
- **High-Contrast Text:** `#F8FAFC` — Primary figures, stock symbols, and key telemetry.
- **Balanced Text:** `#94A3B8` — Metadata labels, column headers, and structural body copy.
- **Muted Text:** `#64748B` — Sub-micro labels, timestamp stamps, and secondary grid markers.

## Typography

Typography enforces absolute visual clarity through a dual-type scale:
- **Primary Interface (`Inter`):** Selected for structural neutral stability, high legibility at micro scales, and clean form factors.
- **Tabular & Monospace (`JetBrains Mono`):** Dedicated exclusively to stock market prices, Indian Rupee (₹) amounts, percentage variations, trading volumes, and model confidence scores. Monospaced tabular alignment guarantees numbers never jitter or displace during rapid ticker re-renders.

### Numeric Rules
- All numeric data displays must utilize `font-feature-settings: "tnum" 1, "zero" 1`.
- Percentage deltas (`+2.45%`, `-1.12%`) must persistently include explicit signs (`+` / `-`) alongside contextual green/red tokens.

## Layout & Spacing

The layout is built on a high-density, multi-pane fluid workspace optimized for rapid spatial scanning and financial monitoring.

### Philosophy & Density
- **Density Index:** Data-dense. Whitespace is tightly constrained (4px–12px internal module rhythm) to maximize the visible analytical surface area above the fold.
- **Grid Architecture:** A dynamic 24-column modular layout on desktop screen sizes (>1440px), allowing asymmetric multi-pane dashboards: Left Market Navigation (4 cols), Central Charting / Order Book Canvas (14 cols), and Right AI Signal Engine & Telemetry (6 cols).
- **Responsive Adaptations:**
  - **Desktop (>=1280px):** 24 columns, full persistent tripartite multi-pane layout.
  - **Tablet (768px - 1279px):** 12 columns, secondary telemetry snaps to tabbed bottom or toggleable slide-over sheets.
  - **Mobile (<768px):** Single-column stacked stream with horizontal sticky sub-nav, preserving compact 8px padding gaps.

## Elevation & Depth

In a dark quantitative terminal, heavy drop shadows cause visual murkiness and reduce edge sharpness. This design system discards standard diffuse black drop-shadows entirely, replacing them with layered surface luminosity and hairline borders.

### Depth Tiers
1. **Layer 0 (Core Shell):** Pure midnight base `#0B0F19` with a static 0.5px subtle background grid crosshatch.
2. **Layer 1 (Card Panes & Analytic Modules):** `#131B2E` elevated with a 1px uniform solid hairline border of `#1E293B`.
3. **Layer 2 (Hover & Active States):** Surface transitions to `#182238` with an accented border illumination of `#22314E` and a directional 1px top-edge rim-light of `rgba(56, 189, 248, 0.15)`.
4. **Layer 3 (Overlays, Modals, Tooltips):** Deep backdrop blur (`backdrop-filter: blur(12px)`) at 85% opacity `#0D131F`, with ambient outer glow: `0 0 24px -4px rgba(56, 189, 248, 0.08)`.

## Shapes

The geometric framework balances technical discipline with modern industrial design:
- Base elements (buttons, inputs, ticker pills, data table cells) utilize **Soft (4px / `0.25rem`)** corners.
- Primary visual containers, terminal cards, and ML telemetry charts utilize **Medium (`0.5rem` / `rounded-lg`)** corner geometry.
- Complete circular pills are restricted solely to live status pings (e.g., market session status, WebSocket active heartbeat).

## Components

### Buttons & Interactive Triggers
- **Primary (Signal Execute / Confirm):** Background `#38BDF8`, text `#0B0F19` (`font-weight: 600`), 0.25rem radius. On hover: subtle cyan glow `0 0 12px rgba(56, 189, 248, 0.4)`.
- **Secondary (Model Parameter / View Shift):** Background `#182238`, text `#F8FAFC`, border 1px solid `#22314E`. Hover: border `#38BDF8`.
- **Destructive / Sell Action:** Background `rgba(239, 68, 68, 0.12)`, text `#EF4444`, border 1px solid `rgba(239, 68, 68, 0.3)`.

### Market Data Cards & Metrics
- **Container:** Background `#131B2E`, border 1px solid `#1E293B`, border-radius `0.5rem`, padding `0.75rem`.
- **Metric Header:** `Inter` label-md (`#94A3B8`) uppercase with a micro indicator badge (e.g., "NSE", "BSE", "NIFTY50").
- **Metric Value:** `JetBrains Mono` numeric-xl (`#F8FAFC`).
- **Trend Footer:** Inline mono badge displaying tick delta in green (`#10B981`) or red (`#EF4444`) with an unambiguous directional triangle (`▲`, `▼`).

### Badges & ML Confidence Pills
- **AI Signal Badge (Strong Buy/Overweight):** Background `rgba(99, 102, 241, 0.15)`, text `#818CF8`, border 1px solid `rgba(99, 102, 241, 0.3)`.
- **Sample/Academic Mock Watermark:** Background `rgba(245, 158, 11, 0.1)`, text `#F59E0B`, border 1px solid `rgba(245, 158, 11, 0.3)`, typography `label-mono`, explicitly designating demo or backtested data.

### Tabular Data Grid (Stock Screener / Watchlist)
- **Header Cell:** JetBrains Mono 10px uppercase, tracking +0.05em, text `#64748B`, height 32px, bottom border 1px solid `#1E293B`.
- **Data Cell:** Height 36px, horizontal padding 8px, font JetBrains Mono numeric-md.
- **Row States:** Alternating striped zebra tinting (`#131B2E` / `#0F1626`). Hover row highlights immediately with `#182238` and a 2px left-border accent in `#38BDF8`.

### Input & Search Fields (Symbol Selector)
- Height 36px, background `#0D131F`, border 1px solid `#1E293B`, text `#F8FAFC`, font Inter body-md. Focus state triggers border `#38BDF8` with zero ring bleed. Includes built-in keyboard shortcut tags (`⌘K` / `Ctrl+K`) in `label-mono`.