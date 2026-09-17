# Hoc Tieu — Design System (adapted from UI UX Pro Max)

Product: Vietnamese 8-hole G xiao flute learning PWA (mobile-first).
Audience: adult / teen learners — warm, calm, readable (not kids-toy Comic Neue).

## Direction
- Soft clay-inspired cards (16–20px radius, gentle shadow) on a warm light canvas
- Musical wood/amber accents; high contrast text
- Bottom nav ≤5; touch targets ≥44px; focus rings visible
- Prefer SVG icons over emoji as icons
- Respect prefers-reduced-motion

## Tokens
```css
--color-primary: #B45309;       /* amber wood */
--color-on-primary: #FFFFFF;
--color-secondary: #0F766E;     /* teal breath */
--color-on-secondary: #FFFFFF;
--color-accent: #CA8A04;
--color-background: #FFFBEB;    /* warm paper */
--color-foreground: #1C1917;    /* near-black */
--color-card: #FFFFFF;
--color-card-foreground: #1C1917;
--color-muted: #FEF3C7;
--color-muted-foreground: #57534E;
--color-border: #FDE68A;
--color-destructive: #DC2626;
--color-ring: #B45309;
--radius-card: 18px;
--shadow-card: 0 8px 24px rgba(180, 83, 9, 0.08), 0 1px 2px rgba(28, 25, 23, 0.06);
```

## Typography
- UI: "Be Vietnam Pro", "Noto Sans", system-ui (Vietnamese-friendly)
- Headings: 600–700 weight; body 16px / line-height 1.55
- Never body text < 14px; muted text must stay ≥ 4.5:1 on background

## Layout
- Phone shell max-width ~430px centered on desktop
- Soft page padding 16–20px; card gaps 12–16px
- Bottom nav with safe-area inset; content padding-bottom for nav
- Lesson rows: clear locked/unlocked/done states (not color-only)

## Motion
- 180–250ms ease-out transitions on hover/press
- Soft press scale(0.98) on buttons
- Skip non-essential motion under prefers-reduced-motion

## Anti-patterns
- Gray-on-gray, low-contrast dark muddy UI
- Emoji-only nav icons without text labels
- Horizontal scroll on mobile
- Instant 0ms state changes
