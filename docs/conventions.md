# Conventions & Standards

This document describes the naming conventions, folder structures, component organization, and code styling rules in the Abzar Kankor project.

---

## 1. Naming Conventions

AI agents must strictly follow these naming patterns:

- **Components**: PascalCase (e.g., `CourseCard.tsx`, `LoginForm.tsx`, `LessonEditor.tsx`).
- **Hooks**: camelCase prefixed with `use` (e.g., `useCourse.ts`, `useSupabase.ts`, `useQueryFilters.ts`).
- **Utilities & Helpers**: camelCase (e.g., `formatDate.ts`, `serializeQuery.ts`).
- **Styles**: kebab-case (e.g., `global.css`, `index.css`).
- **Directories / Features**: kebab-case (e.g., `course-builder`, `flashcard-builder`, `quiz-builder`).
- **TypeScript Types / Interfaces**: PascalCase (e.g., `QueryState`, `FormOption`, `TableRow`).

---

## 2. Component Taxonomy

To keep the codebase clean and avoid giant monolithic files, components are grouped by their scope and purpose:

```
src/components/
├── ui/                     # Generic, styling-only, reusable UI elements (ShadCN / AlignUI)
├── blocks/                 # Large feature components & builders containing business logic
├── widgets/                # Independent, self-contained dashboard displays or stats
└── empty-state-illustrations/  # Visual placeholders for empty views
```

### 1. UI Components (`src/components/ui`)
- **Characteristics**: Pure, generic, reusable, styling-only. They accept standard props.
- **Rules**: They should **never** import business logic, API clients, Jotai atoms, or perform data queries. They should have no knowledge of database structures or domain names (e.g., Courses, Flashcards).

### 2. Feature Blocks (`src/components/blocks`)
- **Characteristics**: Own the business logic, route data flow, execute mutations, and contain components like `course-builder`, `flashcard-builder`, etc.
- **Rules**: Compose pages by combining features. Feature components can use UI components.

### 3. Widgets (`src/components/widgets`)
- **Characteristics**: Smaller, reusable dashboards, charts, and statistics widgets.
- **Rules**: Keep them modular and independent.

---

## 3. The Two "Golden Rules"

### 1. Never Hardcode Hrefs / Path Strings
Always use the type-safe, generated routes object from `src/lib/routes.ts` to reference pages and API endpoints.

- **Bad**: `router.push("/d/courses/123/learn/456")`
- **Good**: `router.push(routes.d.courses.learn.page({ course_id: "123", lesson_id: "456" }))`

### 2. Never Hardcode User-Facing Text
All user-facing copy must be localized. Never render raw text within tags (e.g., `<div>Submit</div>`).
- Always use `useTranslations` (from `next-intl`) to fetch keys.
- Write/update translations in parallel across:
  - `src/messages/en.json` (English)
  - `src/messages/fa.json` (Persian/Dari)
  - `src/messages/ps.json` (Pashto)
