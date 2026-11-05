# Admin — Student details

The admin dashboard shows the **complete picture of every student**: who they
are, what they scored, which classes (courses) they enrolled in, and their
whole study history.

| Route | What it shows |
|---|---|
| `/[locale]/d/admin/users/students` | The student list, with per-student counters (enrollments, decks, classrooms, average score, grades/subjects). |
| `/[locale]/d/admin/users/students/[user_id]` | The full detail page for one student. |

---

## 1. Architecture

Reading a student's academic history spans seven tables (`enrollments`,
`quiz_attempts`, `lesson_progress`, `decks`, `classrooms`, `certificates`,
`bookmarks`/`notes`). Doing that with one query per table from the browser
would be an N+1 storm, and most of those rows belong to *another* user, so
RLS would hide them anyway.

So the data is fetched in the **database**, in one round-trip, by two
`SECURITY DEFINER` functions that are gated on `public.is_admin()`:

| Function | Returns |
|---|---|
| `get_admin_student_overview(p_student_id)` | Every counter plus the enrollments, quiz attempts, deck progress, classrooms, certificates and a 25-item activity timeline — all as `jsonb`. |
| `get_admin_students_overview()` | The same summary counters for *every* student (used where a batch is needed). |

Plus a view, `admin_students_view`, that flattens the per-student counters
into columns so the list page can **search, filter, sort and paginate** them
through the generic `useQueryFilters` hook (URL-synced) like any other table.

The view is `security_invoker = on`, so `profiles` RLS still applies to the
caller: admins see every student, everyone else only what the base policies
allow.

### Files

| Path | Role |
|---|---|
| `supabase/migrations/20261104000000_admin_student_overview.sql` | The RPCs and the view. |
| `src/lib/data/admin-students.ts` | Server-side data access + `normalizeStudentOverview()`. |
| `src/components/blocks/admin/student-overview-panel.tsx` | The presentational panels (stats, tables, timeline). |
| `src/app/[locale]/d/admin/users/students/page.tsx` | The list page. |
| `src/app/[locale]/d/admin/users/students/[user_id]/page.tsx` | The detail page. |

### Applying the migration

The migration has to be applied to the database before the pages show real
data:

```bash
pnpm push:db:production     # or: supabase db push
```

Afterwards, regenerate the TypeScript types so the RPCs and the view are
typed:

```bash
pnpm gen:types               # preferred — reflects the live database
```

If you cannot run `gen:types` yet, the checked-in types can be patched with
the equivalent script (it writes exactly the shape the Supabase generator
produces):

```bash
pnpm types:admin-students
```

> Until the migration is applied, `get_admin_student_overview()` returns
> nothing and the detail page shows the *overview unavailable* message —
> the credit ledger tab keeps working, so nothing regresses.

---

## 2. The detail page

Seven tabs:

| Tab | Contents |
|---|---|
| **Overview** | Academic + activity summary cards, and the student's profile (email, phone, province, credit balance, join date, last activity). |
| **Courses** | Every course enrollment: course, grade, subject, instructor, school, progress, lessons completed, enrolment date, status. |
| **Quiz results** | Every quiz attempt: quiz, grade/subject, attempt number, score, percentage, pass/fail, date, instructor feedback. |
| **Decks** | Flashcard decks: deck, grade/subject, cards mastered / total, progress, last learned. |
| **Classrooms** | Classrooms the student belongs to (teacher, school, role) plus issued certificates. |
| **Activity** | A merged, newest-first timeline of enrolments, quiz attempts, completed lessons, notes and bookmarks. |
| **Credits** | The credit ledger and purchase history (unchanged from before). |

Above the tabs sits a 12-card stat grid: enrolled/completed courses, average
and best quiz score, quiz attempts, quizzes passed, active decks, lessons
completed, study minutes, certificates, classrooms, bookmarks and notes.

---

## 3. Performance

Every panel is fed from **one** RPC call, so the detail page costs two
round-trips in total (profile + overview), in parallel. There is no per-row
querying anywhere.

The list page reads `admin_students_view`, which aggregates in the database —
so the counters on all 20 visible rows cost one query, not 20.

The `jsonb` collections are normalised in
`src/lib/data/admin-students.ts` (`normalizeStudentOverview()`), which
guarantees the UI always receives arrays and never crashes on an unexpected
payload.

---

## 4. Translations

All new strings live in the `admin.students` namespace and exist in **all
three locales** (`en`, `fa`, `ps`).

- `pnpm i18n:admin-students` — writes the namespace into the locale files.
- `pnpm check:admin-students-i18n` — verifies every key exists in every
  locale and that the three locales are in sync.

The check also runs as part of the test suite
(`__tests__/i18n/admin-students-i18n.test.ts`), so a missing key fails CI
rather than surfacing as a broken admin page.

---

## 5. Tests

```bash
pnpm test:admin-student-migration   # runs the migration against a real Postgres
pnpm test                           # unit + component + page tests
```

| Test | Covers |
|---|---|
| `scripts/test-admin-student-migration.js` | Applies the migration to a real PostgreSQL engine (PGlite), seeds a student, and asserts every counter, collection and the admin-only gate. |
| `src/lib/data/admin-students.test.ts` | The `jsonb` → typed-array normalisation, including malformed payloads. |
| `src/components/blocks/admin/student-overview-panel.test.tsx` | Each panel renders its data and its empty state. |
| `src/app/[locale]/d/admin/users/students/[user_id]/page.test.tsx` | The page wires the data layer to the panels, 404s for a missing student and degrades gracefully when the overview is unavailable. |

### The migration test needs PGlite

It is a dev-only dependency and is not part of the app bundle:

```bash
mkdir -p /tmp/pglite-test && cd /tmp/pglite-test
npm init -y && npm install @electric-sql/pglite
```

The script looks for it in `/tmp/pglite-test` and in the repo's
`node_modules`.

---

## 6. Security notes

- The RPCs are `SECURITY DEFINER` with `set search_path = public, pg_catalog`
  and `grant execute … to authenticated`.
- Access is gated by `public.is_admin(auth.uid())` **inside** the function —
  a non-admin calling it gets `Admin access required.`
- `admin_students_view` is `security_invoker = on`, so `profiles` RLS still
  applies to whoever queries it.
