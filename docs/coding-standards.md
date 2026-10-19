# Coding Standards & TypeScript Guidelines

This document details the code-quality, TypeScript typing, and toolchain expectations for developers and AI agents working on the Abzar Kankor codebase.

---

## 1. Type Safety & Database Interfaces

We enforce absolute type safety. The database schema in Supabase acts as the single source of truth.

### Database Typings
- All database types are generated from the database schema using the Supabase CLI.
- **Never manually edit or extend** `src/lib/supabase/database.types.ts`. If database changes are made, they must be regenerated via the CLI (`pnpm gen:types`).

### Utility Types
- Use global typing structures from `src/types/db.types.ts` to type-safety database interactions:
  - `TableViewName`: Represents any database table or view name.
  - `TableRow<T>`: Infers the row data structure for table/view `T`.
  - `ColumnName<T>`: Restricts keys to columns available on table/view `T`.
- Avoid writing custom `interfaces` representing database objects. Use type helpers instead:
  ```typescript
  import type { TableRow } from "@/types/db.types";
  
  // Good: inferred from schema
  type Course = TableRow<"courses">; 
  ```

---

## 2. Code Quality & Tooling

The codebase relies on **Biome** for fast linting, syntax checking, and formatting. We do not use ESLint or Prettier.

### Formatting & Linting Commands
Before pushing code, you must execute:
- **Lint & Syntax Check**: `pnpm check`
- **Format Code**: `pnpm format`
- **Type Check**: `pnpm check:type`
- **All-in-One Verification**: `pnpm verify` (runs checks, type compilation, and tests)

### Rules
- **No `any`**: The use of `any` is strictly prohibited. Use proper generics or TypeScript assertions if needed.
- **Strict Mode**: `strict: true` is enabled in `tsconfig.json`. Ensure all optional parameters and null/undefined values are handled correctly.

---

## 3. UI and Async Rendering Standards

### 1. Avoid Layout Shifts
Layout shifts degrade user experience. For all async loading states:
- Provide exact-sized Skeleton components rather than generic blank spaces.
- Pre-fill inputs with empty strings/booleans (`""`, `false`) rather than `null` or `undefined` to prevent uncontrolled-to-controlled input errors.

### 2. Error Boundaries & Fallbacks
- Wrap components implementing data fetching in React `Suspense` and error boundary catchers.
- Always display a meaningful, localized fallback page or error container when query calls fail, including a "Retry" trigger when applicable.
