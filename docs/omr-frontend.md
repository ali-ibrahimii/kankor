# OMR Frontend: Quiz Print/Scan Dashboard

Next.js layer on top of the Supabase OMR module (`docs/omr-module.md`). Lets
an instructor or school create a standalone quiz, register students, print
bubble sheets, upload scans, review low-confidence detections, and see
results.

## Routes added

| Route | Purpose |
|---|---|
| `/d/instructor/quizzes/[quiz_id]` | OMR detail page for an instructor-owned quiz |
| `/d/school/[school_id]/quizzes/[quiz_id]` | OMR detail page for a school-owned quiz |
| `/api/omr/print?quiz_id=` (GET) | Streams a merged PDF of every printed variant for the quiz's current `print_version` |
| `/api/omr/scan` (POST `{scan_id}`) | Server-to-server bridge to the external Python OMR service; writes `record_omr_scan_result`/`mark_omr_scan_error` |

Both detail pages render the same shared `QuizOmrDetail` component
(`src/components/blocks/quiz-omr/`) — four tabs: Roster, Print & Variants,
Scans, Results. A "Print & Scan" item was added to the existing quizzes list
row menu (`src/components/blocks/quiz-builder/quizzes-view.tsx`) linking here.

## Print-sheet template geometry

**`docs/omr-print-template.md`** is the authoritative, precise coordinate
spec (fiducials, QR position, bubble grid) — mirrored from
`src/lib/omr/template-geometry.ts`, which both the PDF route and the doc must
stay in sync with. This is the handoff artifact for the Python OMR service.

## What was flagged / changed vs. the prior task's assumptions

1. **Dropped the "N anonymous unassigned variants" mode.** The task brief
   described two variant-generation modes, but the Supabase backend (built
   in the prior session) deliberately only supports one variant per
   currently-registered student — no count input, no anonymous/unassigned
   variants. Per explicit user sign-off, this frontend builds only the
   roster-based flow: manage `quiz_registrations`, then Print generates one
   sheet per registered student.

2. **`profiles` is RLS-restricted to self + admin** — there is no policy
   letting an instructor/school owner search or join other users' profiles.
   This means:
   - The "add student by email" flow (`findStudentByEmail`) and every list
     function that needs to display a student's name
     (`listRegistrations`/`listVariants`/`listScans`) do their authorization-
     bearing query with the normal RLS-respecting server client, then
     enrich just the display name/email via a service-role lookup
     (`getStudentDisplayMap` in `quiz-omr/actions.ts`) — mirroring the one
     existing precedent for service-role usage in this codebase
     (`src/app/[locale]/auth/signup/action.ts`). No new RLS policy or
     migration was added; this was a deliberate choice to avoid touching
     the Supabase schema for this task, per instructions.
   - No new "instructor standalone quiz" schema changes were needed, but a
     **real gap was found and fixed**: `quiz-builder/actions.ts`'s `saveQuiz`
     never set `quizzes.user_id` on insert, so creating a quiz with neither
     `school_id` nor `lesson_id` would have silently failed RLS
     (`with check (is_owner(user_id) OR is_admin() OR is_school_editor(school_id))`).
     Fixed by setting `user_id` to the authenticated user server-side
     (never trusted from client input) whenever a new quiz has no
     `school_id`. This is what makes "instructor standalone quiz" creation
     possible at all — flagging since it's a fix to existing code, not new
     OMR-specific code.

3. **The bubble sheet intentionally has no question text** — see
   `docs/omr-print-template.md`'s "What is intentionally not on this sheet"
   section. A companion question booklet (same per-variant shuffled order,
   no fixed-geometry constraint) is a natural follow-up not built here.

4. **`OMR_SERVICE_URL` is optional** (`src/lib/env/schema.ts`,
   `serverEnv.omr.serviceUrl`) since the external Python service doesn't
   exist yet. `/api/omr/scan` calls `mark_omr_scan_error` immediately with a
   clear message if it's unset, rather than silently succeeding — the
   upload/roster/print flows are fully testable today; only the actual
   scoring round-trip is blocked until that service exists and the env var
   is set.

5. **`Dropzone` (`src/components/ui/dropzone.tsx`) gained a `capture` prop**
   forwarded to the underlying file input, needed for the mobile
   camera-capture requirement — it previously only spread extra props onto
   the wrapper `<div>`, which doesn't affect file-picker behavior.

## Manual QR decode

`scans-tab.tsx` tries a client-side QR decode (`jsqr`, off an
`ImageBitmap`/canvas) on the uploaded photo to auto-select the matching
variant; falls back to a manual student/variant dropdown if decoding fails
or doesn't match a printed sheet for this quiz. No server-side QR decode is
needed for this fallback path — the instructor can always pick manually.

## Not built (flagged as follow-up, not silently dropped)

- Student-facing views (self-registration UI beyond what RLS already
  allows, viewing one's own score) — the schema supports `source = 'self'`
  registration and student-readable `quiz_variants`/`omr_scans` rows are
  scoped by RLS, but no student-facing pages were requested or built.
- A companion question booklet PDF (see point 3 above).
- Notifications on scan scored/needs_review (the existing
  `create_app_notification` helper could be wired in later; not requested).
