# Localization & Internationalization (i18n)

This document describes how to implement multi-locale localization in Abzar Kankor to support students across Afghanistan.

---

## 1. Supported Languages

The application fully supports three locales:
1. **Dari/Persian (Farsi)**: `fa` (RTL) - `src/messages/fa.json`
2. **Pashto**: `ps` (RTL) - `src/messages/ps.json`
3. **English**: `en` (LTR) - `src/messages/en.json`

---

## 2. Localization Standards

- **Never hardcode user-facing strings**: All text must be pulled from the translation dictionaries.
- **Synchronize dictionaries**: If you add, modify, or delete a translation key in one JSON file (e.g., `en.json`), you **must** immediately update `fa.json` and `ps.json` with the matching key and localized values.
- **RTL/LTR Layouts**: Styling handles RTL/LTR directionality dynamically. Keep margins/padding direction-agnostic (use logical CSS attributes or tailwind utilities like `ms-2` / `me-4` instead of `ml-2` / `mr-4` where appropriate).

---

## 3. next-intl Usage

We use `next-intl` to manage translations.

### 1. In Client Components
Use the `useTranslations` hook to resolve translation keys:

```tsx
"use client";

import { useTranslations } from "next-intl";

export function SubmitButton() {
  const t = useTranslations("auth.loginPage"); // Scope translation to a section

  return (
    <button type="submit">
      {t("submit")}
    </button>
  );
}
```

### 2. In Server Components
Import `getTranslations` directly inside server modules:

```tsx
import { getTranslations } from "next-intl/server";

export async function Page() {
  const t = await getTranslations("dashboard.student");

  return (
    <div>
      <h1>{t("overview")}</h1>
    </div>
  );
}
```

---

## 4. Advanced Translations

### 1. Variables / Interpolation
Use brackets inside translation JSON files:
- **JSON**: `"welcome": "Welcome back, {username}!"`
- **Component**: `t("welcome", { username: "Ahmad" })`

### 2. Rich Text Formatting
Use `t.rich` to interpolate HTML tags or components:
- **JSON**: `"agreeToTerms": "I agree to the <termsLink>Terms of Use</termsLink>"`
- **Component**:
  ```tsx
  t.rich("agreeToTerms", {
    termsLink: (chunks) => (
      <Link href="/terms-of-use" className="underline">
        {chunks}
      </Link>
    ),
  })
  ```
