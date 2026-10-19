# Component System & Guidelines

This document details guidelines for creating, modifying, and styling components in the Abzar Kankor workspace.

---

## 1. UI Components (`src/components/ui/`)

UI components are the building blocks of the application. They are designed to be generic, highly reusable, and styling-centric.

### Standards
- **Source**: Constructed using **ShadCN UI** presets combined with custom **Align UI** variables.
- **Styling**: Structured using `class-variance-authority` (CVA) or `tailwind-variants` to manage states (hover, focus, sizes, active) cleanly.
- **Rules**:
  1. Do not place business queries, Jotai atoms, or Supabase fetch calls inside folders in `src/components/ui/`.
  2. Keep them highly composable. Allow children and root HTML props (like `className` or input triggers) to pass down seamlessly.

---

## 2. Feature Components & Builders (`src/components/blocks/`)

Feature components (usually builders) are responsible for coordinating specific user experiences (e.g., editing a course, answering a quiz, managing a school classroom, configuring cards).

Our main feature areas include:
- `course-builder/`: Components managing course contents, lessons creation, upload workflows.
- `flashcard-builder/`: Decks configurations, Leitner-system practice dialogs, session stats.
- `quiz-builder/`: Mock exam setup, quiz layouts, results scoring.
- `classroom-builder/`: Student enrollment panels, course assignments, discussion feeds.

### Design Pattern
Keep builders clean by decoupling UI rendering from state handlers:

1. **State / Container Component**: Fetches data, maps callback handlers, holds state triggers, and coordinates mutations.
2. **Form / Presentational Component**: Renders inputs, handles standard events, and binds schema validators.
3. **Logic Custom Hooks**: Package complex logic (e.g. dragging list items, timed quizzes counters) into custom hooks scoped to the feature directory.

---

## 3. Composition vs. Large Configuration Props

Avoid designing components that use hundreds of boolean configurations or nested objects to toggle presentation details. Instead, use children composition:

```tsx
// Bad: Monolithic configuration prop
<CourseCard
  title="Physics"
  showRating={true}
  allowEdit={true}
  renderHeader={<CustomHeader />}
/>

// Good: Composable parts
<CourseCard>
  <CourseCardHeader title="Physics" />
  <CourseCardBody>
    <p>Curriculum Details...</p>
  </CourseCardBody>
  <CourseCardFooter>
    <Button>Start</Button>
  </CourseCardFooter>
</CourseCard>
```
This preserves readability and makes it easy to override elements inside specific layouts (like the Instructor dashboard vs Student mobile view).
