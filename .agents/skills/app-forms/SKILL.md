---
name: app-forms
description: "Use when creating, editing, validating, or submitting forms, input fields, checkboxes, dropdown select lists, textareas, or custom form layouts using the useAppForm hook."
---

# Form Architecture & rendering Guidelines

This skill guides AI agents on implementing forms and validations in the Abzar Kankor codebase.

---

## 1. Core Principles

- **Hook**: Use `useAppForm` from `@/hooks/use-form`. It wraps `@tanstack/react-form` and provides pre-registered input components.
- **Form Component**: Render forms using `<form.AppForm>`.
- **Form Fields**: Render fields using `<form.AppField>`. Render input fields using the component definitions exposed on the `field` object (e.g., `field.TextField`, `field.TextareaField`, `field.CheckboxField`).
- **Submit States**: Use `<form.SubmitButton>` which automatically integrates with the form's `isSubmitting` status and displays a loading spinner when active.
- **Validation**: Schema-based validations must use **Zod** and be mapped in the `validators` prop of `<form.AppField>`.

---

## 2. Example: Creating a Login Form

```tsx
"use client";

import z from "zod";
import { useAppForm } from "@/hooks/use-form";
import { useTranslations } from "next-intl";
import { FieldGroup, Field } from "@/components/ui/field";

export function SimpleLoginForm() {
  const t = useTranslations("auth");

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      // Call mutation or sign-in helper
      console.log("Submit form data: ", value);
    },
  });

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          {/* Email field */}
          <form.AppField
            name="email"
            validators={{
              onBlur: z.string().email(t("validation.invalidEmail")),
            }}
          >
            {(field) => (
              <field.TextField
                label={t("common.emailLabel")}
                placeholder={t("common.emailPlaceholder")}
                type="email"
                autoComplete="email"
              />
            )}
          </form.AppField>

          {/* Password field */}
          <form.AppField
            name="password"
            validators={{
              onBlur: z.string().min(6, t("validation.passwordTooShort")),
            }}
          >
            {(field) => (
              <field.TextField
                label={t("common.passwordLabel")}
                type="password"
                autoComplete="current-password"
              />
            )}
          </form.AppField>

          {/* Submit Action */}
          <Field>
            <form.SubmitButton className="w-full">
              {t("loginPage.submit")}
            </form.SubmitButton>
          </Field>
        </FieldGroup>
      </form>
    </form.AppForm>
  );
}
```

---

## 3. Supported Input Fields

The `createFormHook` in `src/hooks/use-form.tsx` registers the following components, available on the `field` parameter:
- **`field.TextField`**: Standard text/password/email input.
- **`field.TextareaField`**: Multi-line text boxes.
- **`field.CheckboxField`**: Styled checkboxes.
- **`field.RadioGroupField`**: Bullet select choices.
- **`field.SelectField`**: Combines Trigger, value and content.
- **`field.NativeSelectField`**: HTML native dropdown lists.
- **`field.ComboboxField`**: Searchable select dropdowns.
- **`field.SwitchField`**: ON/OFF sliders.
- **`field.SliderField`**: Numeric bounds controllers.
- **`field.OtpField`**: Multi-digit security codes.
