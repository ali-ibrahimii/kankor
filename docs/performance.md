# Performance Optimization Guide

This document describes performance conventions to maintain high speeds, low resource usage, and smooth client transitions.

---

## 1. Next.js Loading & Suspense Patterns
To minimize Cumulative Layout Shift (CLS) and optimize Largest Contentful Paint (LCP):
- **Server Components Streaming**: Wrap heavy data-fetching modules in React `<Suspense>` blocks. Allow Next.js to stream components as queries complete.
- **Skeletons**: Implement structural loading placeholders representing the design dimensions. Never render raw spinners that cause content elements to snap or jump when loading finishes.
- **Dynamic Imports**: Use `next/dynamic` to load heavy client dependencies (e.g., charts, rich text editors) only when needed.

### The `useSearchParams` rule

Any component that reads the URL query string — directly via `useSearchParams`, or indirectly via `nuqs` (`useQueryState`, `useQueryFilters`) — opts out of static prerendering up to the closest `<Suspense>` boundary.

Three ways to satisfy this, in order of preference:

1. **The route is dynamic anyway** — mark the segment `export const dynamic = "force-dynamic"`. Dashboard routes use this: they are session-bound and there is nothing to prerender.
2. **Wrap the consumer** in a `<Suspense>` boundary. `src/components/blocks/sidebar/dashboard-sidebar.tsx` does this for the dashboard chrome, and `src/components/blocks/shared/url-state-boundary.tsx` is the shared helper for URL-synced lists.
3. **Keep the consumer in a dedicated client component** that sits below the boundary (see `src/app/[locale]/d/(student)/library/library-section-resolver.tsx`).

A production build fails with *"useSearchParams() should be wrapped in a suspense boundary"* when this is missed.

---

## 2. React Query Cache Management

To avoid duplicate fetches and improve Interaction to Next Paint (INP):

- **Avoid Duplicative Fetches**: Do not dispatch separate query requests for the same dataset in child components. Lift the query up and pass results downward or access the React Query cache using matching query keys.
- **Cache Configurations**:
  - `staleTime`: Configure appropriate time limits (e.g. 5 minutes for course data) to prevent constant re-fetching on window focus or component remount.
  - `gcTime` (formerly `cacheTime`): Retain query results in inactive states to allow instant back-button navigation.
- **Optimistic Updates**: For user actions (e.g., completing a flashcard, ticking off a task), update the query cache optimistically first, followed by background db synchronization.

The app-wide defaults live in `src/app/[locale]/providers.tsx`:

| Option | Value | Why |
|---|---|---|
| `staleTime` | 5 min | Course/deck/quiz data changes rarely; a short window re-fetches the same catalogue rows on every navigation. |
| `gcTime` | 10 min | Keeps inactive queries cached so back-navigation renders instantly instead of a loading skeleton. |
| `refetchOnWindowFocus` | `false` | A refetch on focus costs a round-trip and visibly janks the UI on mobile, where apps are switched constantly. |
| `retry` | 1 | Three retries with backoff turn a brief network blip into a multi-second spinner. |

---

## 3. Image & Video Optimization

- **Next.js Images**: Always use `<Image />` from `next/image` rather than raw HTML `<img>` tags. Specify `width`, `height`, and responsive sizes (`sizes="..."`) to enable automated webp optimization.
- **Lazy Loading**: Set `priority` flags on hero or first-fold images to optimize LCP. Keep all other images lazy loaded.
- **Video Playback**: Video playback features (crucial for curriculum school courses) should use custom, lightweight player components (e.g., `youtube-player-integration.md`) with placeholder posters, preventing player code bundle loads prior to user click.

---

## 4. Bundle Budget

Heavy third-party libraries must not reach the **shared** chunk that every page
downloads. The shared chunk is loaded on the landing page, so anything in it
is paid for by every visitor.

Measured on the landing page (`/fa`), production build:

| Metric | Budget |
|---|---|
| First-load client JS | ≤ 2 MB |
| Chunks containing a heavy lib | must be route-specific, never shared |

### Libraries that must stay lazily loaded

| Library | Size | How |
|---|---|---|
| `exceljs` | ~900 KB | `await import("exceljs")` inside the parser (`src/features/import/parsers/xlsx.parser.ts`) — the spreadsheet importer is only opened by an admin. |
| `@lexical/*` | ~410 KB | `next/dynamic` in `src/hooks/use-form.tsx` — the rich-text editor is only rendered by the course/lesson builders, but `use-form` is imported by ~30 components. |
| `pdfjs-dist` | ~417 KB | `await import("pdfjs-dist")` in `src/features/import/parsers/pdf.parser.ts`. |
| `firebase/messaging` | ~56 KB | `await import("firebase/messaging")` in `src/lib/firebase/index.ts` — push notifications are opt-in. |

**Rule:** a library that is only needed after a user interaction is loaded with a dynamic `import()` *inside* the function that needs it, never at module top level. A top-level static import puts it in the shared chunk.

Verify after changing any dependency:

```bash
pnpm build
# then inspect the landing page's script references
node -e "
const fs=require('fs');
const html=fs.readFileSync('.next/server/app/fa.html','utf8');
const refs=[...new Set([...html.matchAll(/static\/chunks\/[^\"']*?\.js/g)].map(m=>m[0]))];
let sum=0;
for(const r of refs){const f='.next/'+r; if(fs.existsSync(f)) sum+=fs.statSync(f).size;}
console.log('first-load JS:', (sum/1024).toFixed(0)+'KB');
"
```

---

## 5. Network Timeouts and Fail-Fast

A request to an unreachable host (wrong project URL, blocked egress, DNS
blackhole) blocks on the socket until the OS gives up — in practice a
multi-minute hang rather than a fast, actionable error.

- **Every Supabase client** passes a bounded `fetch` (10 s ceiling) via the
  `global.fetch` option — see `src/lib/supabase/server.ts`,
  `src/lib/supabase/client.ts` and `src/lib/supabase/middleware.ts`.
- **Server code** checks `isSupabaseServerConfigured` (from
  `@/lib/env/server-env`) before touching the network. It rejects both missing
  credentials and the inert `demo.invalid` / `example.invalid` placeholders.
  A placeholder URL would otherwise block on DNS for the full timeout on every
  page.
- **Public pages** that would otherwise block on a missing backend return their
  empty/placeholder state immediately instead.

---

## 6. Server-Side Caching

- Public marketing pages use `export const revalidate = 518400` (6 days);
  catalogue detail pages use `86400` (1 day).
- Dashboard routes are `force-dynamic` — a dashboard is never the same for two
  visitors, so there is nothing to cache.
- `src/lib/supabase/server.ts` uses the request-scoped client from
  `@supabase/ssr`, which participates in Next.js's request cache.
