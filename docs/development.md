# Development Workflow Guide

This document describes the workflow commands, configurations, and steps for running the development server and performing updates.

---

## 1. Getting Started

### Prerequisites
- Node.js installed.
- **pnpm** (preferred package manager).
- Supabase CLI installed locally (if executing database modifications).

### Step-by-Step Run
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the local server:
   ```bash
   pnpm dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 2. Testing & Quality Gates

Run formatting and compilation checks to maintain code quality:

- **Lint & Syntax check**: `pnpm check`
- **Format files**: `pnpm format`
- **TypeScript build check**: `pnpm check:type`
- **Run all unit/integration tests**: `pnpm test`
- **Verify command**: `pnpm verify` (runs checks, type compilation, and tests)
- **Run E2E tests**: `pnpm test:e2e`

---

## 3. Database Development & Migrations

When modifying schemas or testing tables locally:
- Save migration queries as SQL scripts under `./supabase/migrations/`.
- Regenerate typescript schema interfaces:
  ```bash
  pnpm gen:types
  ```
- Make sure to add matching unit tests for any new tables or views.

---

## 4. Guidance for AI Coding Agents

AI agents working on this codebase should use the built-in system plugins and specialized skills for deep developer contexts:

- **Supabase CLI / PostgreSQL Rules**: When editing migrations, refer to Postgres and Supabase best-practice documentation in the customization workspace.
- **Vite & React Contexts**: Access Vite, Vitest, and React 19 rulesets dynamically.
- **Accessibility & CSS**: Use accessibility auditing plugins to guarantee visual and keyboard accessibility for students.
- **Prompt Customizations**: Load available skills inside `.agents/skills/` or `.claude/skills/` using intent matching helpers (e.g. `@tanstack/intent`).
