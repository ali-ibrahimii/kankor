# Routing & Page Architecture

This document describes the structure of routes and navigation mechanisms in the Abzar Kankor project.

---

## 1. App Router Structure

The routes of the application are designed under the Next.js App Router, using a `[locale]` dynamic group to handle internationalization globally.

Primary layout folders under `src/app/[locale]/` are structured by client/role:
- `/auth/`: Registration, login, password resets, and confirm-email routes.
- `/d/`: Dashboard landing layouts.
  - `/d/(student)/`: Student-scoped experiences (School courses, practice cards, mock tests, and the digital library).
  - `/d/admin/`: Admin panels (mock test creators, general database views).
  - `/d/instructor/`: Teacher portals (classroom creators, statistics, course editing tools).
  - `/d/school/`: School-specific curriculum views.

---

## 2. Type-Safe Routes Utility (`routes.ts`)

To avoid broken links and manual URL mistakes, path mappings are generated under `src/lib/routes.ts`.

### Rules
- **No raw strings**: Never write links as literal strings like `/auth/login` or `/d/courses/${id}` in your components.
- **Dynamic Route parameters**: The generator creates route functions that enforce required arguments for dynamic segments (e.g. `:course_id`).

### Usage Example
Import the `routes` helper object and call the appropriate route endpoint:

```tsx
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export function CourseItem({ id }: { id: string }) {
  return (
    <Link href={routes.d.courses.page()}>
      View All Courses
    </Link>
  );
}

// Navigating programmatically
import { useRouter } from "@/i18n/navigation";

export function LearnButton({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter();

  const handleGo = () => {
    router.push(
      routes.d.courses.learn.page({
        course_id: courseId,
        lesson_id: lessonId,
      })
    );
  };

  return <button onClick={handleGo}>Start Learning</button>;
}
```

---

## 3. Route Generation (`pnpm gen:routes`)

If you add new folders or page files to the Next.js router, the routes object must be updated:
- Running `pnpm gen:routes` executes `scripts/generate-routes.js` to scan `src/app` and output the updated type definitions in `src/lib/routes.ts`.
- Make sure to review the resulting git diff to confirm no unexpected mappings were generated.
