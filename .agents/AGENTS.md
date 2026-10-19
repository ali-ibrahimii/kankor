# AI Agent Guide — Abzar Kankor

Welcome to the Abzar Kankor workspace! This document specifies the project guidelines, standards, and rules that all AI agents must follow.

---

## 1. Onboarding Path
Before writing any code or making edits, you **must** read the core documentation in order:
1. [project-overview.md](file:///Volumes/Projects/abzarkankor/web/docs/project-overview.md) — Product intent & audience.
2. [architecture.md](file:///Volumes/Projects/abzarkankor/web/docs/architecture.md) — Server Components, boundaries, and state.
3. [conventions.md](file:///Volumes/Projects/abzarkankor/web/docs/conventions.md) — Naming patterns and directory setups.
4. [coding-standards.md](file:///Volumes/Projects/abzarkankor/web/docs/coding-standards.md) — Linters, type safety, and UI integrity.

---

## 2. Core Workspace Rules

### 1. Data Fetching & Caching
- **Simple Client Queries**: Use `useSupabase` (from `src/hooks/use-supabase.ts`).
- **Lists, Filtering, Sorting, Pagination, and Searching**: Use `useQueryFilters` (from `src/hooks/filter/filter.hooks.ts`). It automatically syncs query states in the browser's URL query string under `filters` using `nuqs`.
- **Server Queries**: Use server clients directly inside Server Components.

### 2. Forms
- **Forms Stack**: Use `useAppForm` (from `src/hooks/use-form.tsx`) to manage inputs, validation, and submission states.
- **Form Rendering**: Use `<form.AppForm>`, `<form.AppField>`, and `<form.SubmitButton>` to hook into loading states automatically.

### 3. Type Safety
- **Strict Mode**: Never use `any`.
- **Database Typings**: Import and use types from `src/lib/supabase/database.types.ts` and general DB utility types from `@/types/db.types.ts`. Do not write custom manual typings for database schema entities.
- **Generated Code**: Never edit generated files (e.g. `database.types.ts`, `routes.ts`).

### 4. Routing
- **Standard**: Never hardcode route href strings (e.g., `<Link href="/auth/login">`).
- **Method**: Always use the generated type-safe routes helper:
  ```tsx
  import { routes } from "@/lib/routes";
  // routes.auth.login.page()
  ```

### 5. Localization
- **Standard**: Never write raw, hardcoded user-facing text strings in components.
- **Method**: Use `useTranslations` (from `next-intl`) and write translations across English (`en.json`), Persian/Dari (`fa.json`), and Pashto (`ps.json`).

### 6. UI Components
- **Framework**: Always use ShadCN and Align UI components located under `@/components/ui/*`.
- **Composition**: Prefer layout children composition over passing monolithic configuration props.

### 7. Enforced Testing Requirements
- **Standard**: AI agents **MUST** write unit, integration, and Playwright E2E tests for all new features or functional modifications.
- **Commands**:
  - Run Vitest: `pnpm test`
  - Run Playwright: `pnpm test:e2e`

---

## 3. Specialized Skills
You are encouraged to invoke specialized skills (e.g. `react`, `nextjs`, `supabase`) for database or framework-specific guidelines during complex tasks.


<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->