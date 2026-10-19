# Performance Optimization Guide

This document describes performance conventions to maintain high speeds, low resource usage, and smooth client transitions.

---

## 1. Next.js Loading & Suspense Patterns

To minimize Cumulative Layout Shift (CLS) and optimize Largest Contentful Paint (LCP):
- **Server Components Streaming**: Wrap heavy data-fetching modules in React `<Suspense>` blocks. Allow Next.js to stream components as queries complete.
- **Skeletons**: Implement structural loading placeholders representing the design dimensions. Never render raw spinners that cause content elements to snap or jump when loading finishes.
- **Dynamic Imports**: Use `next/dynamic` to load heavy client dependencies (e.g., charts, rich text editors) only when needed.

---

## 2. React Query Cache Management

To avoid duplicate fetches and improve Interaction to Next Paint (INP):
- **Avoid Duplicative Fetches**: Do not dispatch separate query requests for the same dataset in child components. Lift the query up and pass results downward or access the React Query cache using matching query keys.
- **Cache Configurations**:
  - `staleTime`: Configure appropriate time limits (e.g. 5 minutes for course data) to prevent constant re-fetching on window focus or component remount.
  - `gcTime` (formerly `cacheTime`): Retain query results in inactive states to allow instant back-button navigation.
- **Optimistic Updates**: For user actions (e.g. completing a flashcard, ticking off a task), update the query cache optimistically first, followed by background db synchronization.

---

## 3. Image & Video Optimization

- **Next.js Images**: Always use `<Image />` from `next/image` rather than raw HTML `<img>` tags. Specify `width`, `height`, and responsive sizes (`sizes="..."`) to enable automated webp optimization.
- **Lazy Loading**: Set `priority` flags on hero or first-fold images to optimize LCP. Keep all other images lazy loaded.
- **Video Playback**: Video playback features (crucial for curriculum school courses) should use custom, lightweight player components (e.g., `youtube-player-integration.md`) with placeholder posters, preventing player code bundle loads prior to user click.
