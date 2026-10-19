# Project Overview: Abzar Kankor

Welcome to the **Abzar Kankor** educational web application. This document provides a high-level overview of the application's goals, features, target audience, and baseline technology stack.

---

## 1. Goal & Audience

Abzar Kankor is designed as a hybrid and offline-first educational platform for students in Afghanistan. Its primary goals are to:
- Support standard school curriculum study (specifically Grades 10, 11, and 12).
- Prepare students for the **Kankor** exam (the nationwide competitive university entrance exam in Afghanistan).
- Deliver high-quality education content under severe internet connectivity and bandwidth constraints.

The application serves students, instructors, and administrators.

---

## 2. Core Modules

The application is structured into five primary modules:

### 1. School
- **Purpose**: Interactive, curriculum-aligned school courses.
- **Features**: Video lessons grouped by grade levels (10-12) and subjects (e.g., Mathematics, Physics, Chemistry, Biology, History, etc.).
- **Material**: Accompanying PDF slides, presentations, and features for digital note-taking during video playback.

### 2. Courses
- **Purpose**: General publisher-curated educational courses.
- **Features**: Enables instructors, schools, and the Abzar Kankor platform itself to create, customize, and publish video-based learning courses. Includes lesson editors, quizzes, assignments, and curriculum scheduling tools.

### 3. Flashcards (Spaced Repetition)
- **Purpose**: Long-term memory retention of school textbook facts.
- **System**: Uses the **Leitner System** for spaced repetition.
- **Database**: Over 13,000 pre-authored flashcards extracted from official school textbooks.
- **Interactivity**: Students can create custom decks, practice pre-built decks, and view progress/statistics.

### 4. Tests & Quizzes
- **Purpose**: Self-assessment and exam practice.
- **Mock Kankor**: Complete simulation of the university entrance exam, timing-controlled, with multi-subject questions and automated grading.
- **Subject-based tests**: Mini-exams specific to individual school subjects or books.
- **Practice Quizzes**: Instant-feedback question sets embedded in courses or decks.

### 5. Library
- **Purpose**: Digital resource hub.
- **Features**: A curated library of PDF textbooks, study guides, solved Kankor question banks, and reference books categorized by subject and academic level.

---

## 3. Technology Stack

The project relies on a modern, robust, and highly type-safe web technology stack:

- **Frontend Framework**: [Next.js](https://nextjs.org/) (version 16.2.9) leveraging the App Router.
- **Backend & Auth**: [Supabase](https://supabase.com/) for authentication, database access, storage, and server-side actions.
- **State Management**:
  - React State for local component concerns.
  - [Jotai](https://jotai.org/) for lightweight client-side shared state (e.g., sidebar collapse, local UI settings).
  - [TanStack Query (React Query)](https://tanstack.com/query/latest) for server cache caching and mutations.
- **Form Management**: [TanStack Form](https://tanstack.com/form/latest) with Zod schemas for validation.
- **URL Query Sync**: [nuqs](https://nuqs.47ng.com/) for synchronizing search filters, sorting, and pagination directly with the browser's URL query string.
- **UI Kit & Styling**: [Align UI](https://alignui.com/) and [ShadCN UI](https://ui.shadcn.com/) powered by [Tailwind CSS](https://tailwindcss.com/) (version 4.3.1).
- **Linter & Formatter**: [Biome](https://biomejs.dev/) (replaces ESLint and Prettier) for fast checks and code styling.
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration testing, and [Playwright](https://playwright.dev/) for E2E user flow tests.
