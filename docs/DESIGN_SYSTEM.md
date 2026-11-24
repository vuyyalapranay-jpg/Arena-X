# ARENA X — Visual Design System & UI Specifications

**Aesthetic Benchmark:** Dark, Atmospheric, High-Impact Console Fighting Game (Mortal Kombat 11 / Shadow Fight 2 / 2XKO inspired)  
**Target:** Clean, professional, zero-clutter interface tailored for 16:9 desktop & mobile landscape gaming.

---

## 1. Color Palette

```css
:root {
  /* Surface Foundations */
  --color-bg-abyss: #04060A;          /* Deepest background base */
  --color-bg-charcoal: #080B12;       /* Primary panel & card background */
  --color-bg-surface: #0E1320;        /* Elevated card & modal surface */
  --color-bg-surface-hover: #151C2E;  /* Interactive hover state */
  
  /* Borders & Dividers */
  --color-border-subtle: rgba(255, 255, 255, 0.08);
  --color-border-medium: rgba(255, 255, 255, 0.16);
  --color-border-glow: rgba(14, 165, 233, 0.4);

  /* Primary Accent: Crimson Strike */
  --color-crimson: #E11D48;
  --color-crimson-bright: #FF2E63;
  --color-crimson-glow: rgba(225, 29, 72, 0.45);

  /* Secondary Accent: Electric Azure */
  --color-azure: #0EA5E9;
  --color-azure-bright: #38BDF8;
  --color-azure-glow: rgba(14, 165, 233, 0.45);

  /* Mastery & Economy Accent: Tournament Gold */
  --color-gold: #F59E0B;
  --color-gold-bright: #FBBF24;
  --color-gold-glow: rgba(245, 158, 11, 0.45);

  /* Text & Typography */
  --color-text-primary: #F8FAFC;      /* Pure readable white-platinum */
  --color-text-secondary: #94A3B8;    /* Muted steel information */
  --color-text-muted: #64748B;        /* Micro copy & disabled tags */
}
```

---

## 2. Typography

- **Display & Headings:** `Teko`, `Rajdhani`, sans-serif (Bold, condensed, aggressive combat game lettering).
- **Body & Numerical Readouts:** `Inter`, `Roboto Mono`, monospace (Crisp, highly legible frame-data and timers).
- **Text Transforms:** All section titles and button actions utilize uppercase tracking: `text-transform: uppercase; letter-spacing: 0.08em;`.

---

## 3. Component Architecture

### 3.1 Main Lobby Layout
- **Header:** Sleek horizontal status strip with live server connectivity badge, player level badge, XP progress bar, and AX Coins balance.
- **Hero Presentation:** Left-aligned console action menu; Right-aligned featured fighter artwork with dynamic breathing animation and subtle elemental particle glow.
- **Action Buttons:**
  - Angular cut-corners (`clip-path: polygon(...)`).
  - High-contrast active states with animated edge-lines and crimson/azure glow.
  - Distinct auditory feedback on hover and click via `SoundManager`.

### 3.2 In-Match Combat HUD
- **Health Gauges:**
  - Angular, forward-slanted life bars.
  - Multi-tier visual layers: Active Green/Cyan health, trailing Amber damage buffer, and dark backing.
- **Super Energy Gauges:**
  - 3-stock discrete segments with pulsing glow at 100% capacity.
- **Round Indicators:**
  - Metallic hex gems that illuminate in gold upon winning a round.
- **Match Announcer:**
  - Giant cinematic typography with zoom-in entrance and flash dissolution.

### 3.3 Mobile Touch Controls
- Floating analog directional pad on lower-left thumb zone.
- Ergonomic radial cluster on lower-right:
  - Big primary buttons: Light Punch, Heavy Strike, Kick.
  - Secondary thumb perimeter buttons: Special, Ultimate, Dodge, Block.
- Touch prevention: `touch-action: none; user-select: none;` across the canvas container to prevent unintended browser scroll or zoom.
