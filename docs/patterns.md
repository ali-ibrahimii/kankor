# Patterns

This document describes the architectural and implementation patterns used throughout the Abzar Kankor codebase.

AI agents **must prefer existing patterns** over introducing new abstractions. Before implementing a feature, search the repository for a similar implementation and follow the established approach.

---

# General Principles

## Prefer Consistency

This project values consistency over cleverness.

If multiple implementations are possible, choose the one that matches the existing codebase.

Avoid introducing new architectural patterns unless explicitly requested.

---

## Build on Existing Features

Before creating:

- Components
- Hooks
- Utilities
- Providers
- Forms
- Builders
- Dialogs

Search for an existing implementation.

It is almost always better to extend an existing feature than to create a new one.

---

# Component Patterns

## UI Components

Location

```
src/components/ui
```

Characteristics

- Generic
- Reusable
- No business logic
- Styling only
- Accept props
- Composable

Examples

- Button
- Input
- Dialog
- Dropdown
- Tabs
- Card

UI components should never know about:

- Supabase
- Courses
- Flashcards
- Users
- Schools

---

## Feature Components

Location

```
src/components/blocks
```

Feature components encapsulate business logic.

Examples

```
course-builder
flashcard-builder
quiz-builder
classroom-builder
```

Responsibilities

- Fetch data
- Compose UI
- Manage feature state
- Call mutations

Feature components may use UI components internally.

---

## Widgets

Location

```
components/widgets
```

Widgets are small self-contained feature displays.

Examples

- Dashboard cards
- Statistics
- Recent activity
- Progress

Widgets should remain independent.

---

# Page Pattern

Pages should remain thin.

A page should primarily:

- Read route params
- Fetch initial data
- Compose feature components

Avoid placing complex business logic directly inside pages.

Good

```
Page

↓

CourseBuilder

↓

LessonEditor

↓

LessonForm
```

Bad

```
Page

↓

700 lines of logic
```

---

# Data Fetching

## Server First

Prefer Server Components whenever possible.

Server Components should fetch data directly.

Avoid converting pages to Client Components just to fetch data.

---

## Client Fetching

Client-side fetching should only be used when necessary.

Examples

- Live updates
- Search
- Infinite scrolling
- Optimistic updates
- Interactive dashboards

Use TanStack Query.

---

## Avoid Duplicate Fetches

Do not fetch the same resource multiple times.

Instead:

- Lift the query higher
- Pass data downward
- Share query cache

---

# React Query Pattern

Use React Query for:

- Client state synchronized with the server
- Mutations
- Background refetching
- Pagination
- Infinite queries

Avoid using React Query as a replacement for local UI state.

---

# Forms

All forms should follow the same pattern.

```
Page

↓

Feature Component

↓

Form Component

↓

Validation

↓

Mutation
```

Validation should use:

- Zod
- TanStack Form

Business validation belongs outside presentation components.

---

# Dialog Pattern

Dialogs should contain only dialog-specific behavior.

Business logic belongs in hooks or feature components.

Example

```
DeleteCourseDialog

↓

useDeleteCourse()

↓

Supabase
```

Avoid placing database logic directly inside dialog components.

---

# Builder Pattern

Large editing experiences should use builders.

Examples

- Course Builder
- Flashcard Builder
- Quiz Builder
- Classroom Builder

Builders should own:

- Editing state
- Navigation
- Draft management
- Validation
- Save operations

Builders should expose smaller reusable child components.

Avoid monolithic builders.

---

# Custom Hooks

Location

```
src/hooks
```

Hooks should encapsulate reusable behavior.

Good examples

```
useCourse()

useCourseLessons()

useDeck()

usePagination()

useFilters()
```

Avoid hooks that only wrap a single useState unless reused.

---

# Utilities

Location

```
src/utils
```

Utilities should be:

- Pure
- Stateless
- Easily testable

Avoid importing React into utility files.

---

# Providers

Location

```
src/providers
```

Providers should expose application-wide concerns.

Examples

- Theme
- Authentication
- Query Client
- Localization

Avoid creating providers for feature-specific state.

---

# State Management

Choose the smallest appropriate scope.

## Local State

Use React state.

```
useState()
```

---

## Shared Client State

Use Jotai.

Only for state shared across multiple unrelated components.

Examples

- Sidebar state
- Preferences
- UI settings

Do not duplicate server data in atoms.

---

## Server State

Use React Query.

Examples

- Courses
- Lessons
- Decks
- Quizzes

---

# Server Components

Prefer:

- Async Server Components
- Streaming
- Suspense

Client Components should exist only when interactivity requires them.

---

# Client Components

Only add

```
"use client"
```

when necessary.

Examples

- Forms
- Drag-and-drop
- Rich editors
- Interactive builders

Do not mark entire pages as client components unnecessarily.

---

# Route Pattern

Pages should follow this flow.

```
Route

↓

Layout

↓

Page

↓

Feature Component

↓

Reusable Components

↓

UI Components
```

Avoid skipping layers.

---

# Error Handling

Expected errors

- Show meaningful UI
- Explain what happened
- Allow retry

Unexpected errors

- Log
- Display friendly fallback
- Avoid exposing internal details

---

# Loading States

Every asynchronous feature should have a loading state.

Examples

- Skeleton
- Spinner
- Placeholder

Avoid layout shifts during loading.

---

# Empty States

Use reusable empty state illustrations when available.

Location

```
components/empty-state-illustrations
```

Do not display blank pages.

---

# Table Pattern

Use TanStack Table.

Keep:

- Table state
- Filters
- Pagination
- Sorting

outside individual row components.

---

# Search Pattern

Search should be:

- Debounced
- Cached
- Server-driven when appropriate

Avoid filtering thousands of records on the client.

---

# Pagination Pattern

Prefer server pagination.

Client pagination is acceptable only for small datasets.

---

# Authentication Pattern

Authentication is handled by Supabase.

Never manually inspect JWTs.

Always use the project's authentication helpers.

Avoid duplicating authentication logic.

---

# Authorization Pattern

Authorization is enforced primarily through Supabase Row Level Security (RLS).

Frontend code should never assume permissions.

Always rely on backend authorization.

---

# Database Pattern

Generated database types are the source of truth.

Never manually redefine database models.

Never edit

```
database.types.ts
```

---

# File Organization

Large features should be organized like:

```
feature/

    components/

    hooks/

    lib/

    types/

    utils/
```

Avoid placing hundreds of files into a single directory.

---

# Naming Pattern

Components

```
CourseCard.tsx
LessonEditor.tsx
```

Hooks

```
useCourse.ts
```

Utilities

```
format-date.ts
```

Types

```
course.ts
```

Directories

```
course-builder
flashcard-builder
```

---

# Performance Pattern

Prefer

- Server Components
- Lazy loading
- Streaming
- Memoization only when needed

Avoid

- Premature optimization
- Deep prop drilling
- Unnecessary context providers

---

# Accessibility Pattern

Interactive elements should:

- Be keyboard accessible
- Have visible focus states
- Use semantic HTML
- Include accessible labels

Accessibility is not optional.

---

# Before Adding New Code

Ask the following questions:

- Does something similar already exist?
- Can I extend an existing component?
- Can I reuse an existing hook?
- Does this belong in `components/ui` or `components/blocks`?
- Does this introduce unnecessary duplication?
- Does this preserve localization?
- Does this preserve type safety?
- Does this follow the existing folder structure?

If the answer to any of these is "no", reconsider the implementation.

---

# AI Agent Checklist

Before submitting changes, verify:

- ✅ Existing patterns were followed
- ✅ No duplicate components were created
- ✅ TypeScript remains strictly typed
- ✅ Localization is preserved
- ✅ No generated files were modified
- ✅ Server Components are preferred where possible
- ✅ Business logic is separated from UI
- ✅ RLS assumptions are respected
- ✅ Components remain small and composable
- ✅ The implementation matches the surrounding codebase