# Testing Strategy & Enforced Standards

This document describes the testing setup, frameworks, execution commands, and guidelines for writing tests in the Abzar Kankor project.

---

## 1. Enforced Standard for AI Agents

**AI agents must write unit, integration, and E2E tests for all new features, components, or major refactorings.**

Do not consider a task complete without the corresponding test coverage:
- **Unit Tests**: For isolated utility functions, custom state hooks, and presentation components.
- **Integration Tests**: For complex feature sheets, builders, and forms that coordinate data queries or local state.
- **E2E (End-to-End) Tests**: For critical user paths (e.g. login, course creation, mock exam execution, profile deletion).

---

## 2. Testing Frameworks

The application implements a dual-layer testing pipeline:

### 1. Unit & Integration Testing: [Vitest](https://vitest.dev/)
- **Setup**: Configured with `jsdom` to emulate browser behaviors.
- **Location**: Unit tests live in the same directory as their target files or inside `__tests__` using the `.test.ts` or `.test.tsx` extensions.
- **Commands**:
  - Run tests: `pnpm test`
  - Watch mode: `pnpm test:watch`
  - Coverage report: `pnpm test:coverage`

### 2. End-to-End (E2E) Testing: [Playwright](https://playwright.dev/)
- **Setup**: Playwright tests execute against multiple simulated browser targets.
- **Location**: Configured inside the `/e2e/` folder.
- **Commands**:
  - Run E2E tests (headless): `pnpm test:e2e`
  - Run E2E tests (interactive UI): `pnpm test:e2e:ui`

---

## 3. Test Writing Examples

### 1. Writing a Vitest Unit Test (e.g., mapping function)
```typescript
// format-date.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./format-date";

describe("formatDate Utility", () => {
  it("should format dates correctly", () => {
    const result = formatDate("2026-07-03");
    expect(result).toBe("July 3, 2026");
  });
});
```

### 2. Writing a Playwright E2E Test
```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("should allow a student to log in successfully", async ({ page }) => {
    await page.goto("/auth/login");

    // Input email and password
    await page.fill('input[type="email"]', "student@abzarkankor.com");
    await page.fill('input[type="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Confirm dashboard redirection
    await expect(page).toHaveURL(/\/d/);
  });
});
```

---

## 4. Pre-flight Verification

Before committing code, verify the whole workspace:
```bash
pnpm verify
```
This runs the TypeScript compiler check, lint check, and all Vitest unit tests in a single command.
