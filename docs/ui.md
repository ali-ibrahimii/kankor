# UI Design & Styling Patterns

This document details styling specifications, layout responsiveness, and premium aesthetic requirements.

---

## 1. UI Stack: ShadCN & Align UI

We combine **ShadCN UI** presets with **Align UI** variables and components:
- **ShadCN components**: Retained inside `src/components/ui/` (e.g., button, dialog, checkbox, input-otp, select).
- **Tailwind CSS**: The workspace utilizes Tailwind CSS 4.0 (`@tailwindcss/postcss`) configured in `postcss.config.mjs` and `next.config.ts`.
- **CSS Variables**: Global variables managing themes (backgrounds, border colors, focus outlines, primary/destructive shades) are mapped in `src/styles/` files.

---

## 2. Aesthetics & Premium Visual Polish

To deliver an exceptional user experience, developers and agents must adhere to the following visual standards:

### 1. Color Palettes
- Avoid standard, generic primary colors (e.g., raw `#ff0000` or `#0000ff`).
- Use cohesive, dark-mode compatible Tailwind variables (e.g., `text-muted-foreground`, `bg-card`, custom brand slate-greens, etc.).

### 2. Glassmorphism & Depth
- Leverage backdrop filters and borders to establish layout depth:
  ```css
  bg-background/80 backdrop-blur-md border-border/50
  ```
- Use smooth shadow presets (`shadow-sm`, `shadow-md`) to elevate active cards or floating dialogs.

### 3. Transitions & Micro-Animations
- Interactive elements must implement clear focus states, hover transitions, and active clicks:
  ```css
  transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
  ```
- Incorporate subtle keyframe micro-animations (e.g., using `framer-motion` or CSS transitions) for tab switching, loading states, and layout expansions.

---

## 3. Layout and Responsive Adaptations

The application supports two primary user layout scopes:
- **Mobile-First Student Interface**: Designed primarily for mobile views (nested grids, bottom navigation, bottom sheets via `vaul`). Keep inputs, text sizes, and touch targets comfortable for finger taps.
- **Desktop Instructor/Admin Panels**: Layouts structured as multi-column sidebars, dashboard grid layouts, and comprehensive data tables.

Ensure all new feature components adapt fluidly between desktop and mobile break-points.
