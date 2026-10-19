# OMR (Bubble-Sheet) Quiz Module

Backend for printing paper answer sheets from an existing quiz, tracking which
students are registered to take it, and scoring uploaded scans via an
external Python OMR (optical mark recognition) service.

Migration: `supabase/migrations/20260706160000_omr_quiz_module.sql`.
Sample data: `supabase/seeds/omr_module_seed.sql` (run manually, not part of
`db reset`'s auto-seed — see the header comment in that file).

This module makes **zero changes** to the existing online quiz engine
(`quizzes`, `questions`, `question_options`, `quiz_attempts`, `answers`) beyond
adding three new nullable/defaulted columns to `quizzes`. A quiz can continue
to be used for online, entrance-code-based attempts exactly as before; the
OMR module is a layer on top for printing and scoring the same question bank
on paper.

## Why not a parallel `omr_quizzes`/`omr_questions` table set

The repo already has a live `quizzes`/`questions`/`question_options` engine.
Rather than duplicate the question-bank concept, this module reuses those
tables as the single source of truth for quiz content, and adds print/roster/
scan-specific tables around them. `answer_sheets` was **not** reused as a name
for the scan table — that name is already taken by an unrelated, pre-existing
per-lesson answer-key table (`lesson_id`, `question_number`, `answer_number`).
The new tables are prefixed `omr_` to avoid any ambiguity.

## Schema

### `quizzes` (existing table, 3 new columns)
| Column | Type | Meaning |
|---|---|---|
| `registration_deadline` | `timestamptz`, nullable | After this, students can no longer self-register. Null = always open. |
| `locked_at` | `timestamptz`, nullable | Set the moment answer sheets are first printed. While set, `questions`/`question_options` for this quiz cannot be edited (DB trigger). |
| `print_version` | `integer not null default 0` | Bumped each time the quiz goes unlocked → locked (i.e. each distinct print run following an edit). Stamped onto `quiz_variants.template_version`. |

### `quiz_registrations`
The roster of students booked to take a quiz on paper. A join table between
`quizzes` and `profiles`.

| Column | Type |
|---|---|
| `id` | uuid pk |
| `quiz_id` | uuid → `quizzes(id)` |
| `student_id` | uuid → `profiles(id)` |
| `source` | enum `quiz_registration_source` (`self`, `owner`) |
| `registered_by` | uuid → `profiles(id)` — who performed the registration |
| `created_at`/`updated_at` | timestamptz |

Unique on `(quiz_id, student_id)`.

### `quiz_variants`
One row per printed sheet — exactly one variant per registered student, per
print run (`template_version`).

| Column | Type |
|---|---|
| `id` | uuid pk |
| `quiz_id` | uuid → `quizzes(id)` |
| `student_id` | uuid → `profiles(id)` |
| `question_order` | `uuid[]` — ordered `questions.id`s as printed |
| `shuffled` | boolean — whether question order was shuffled for this print run |
| `template_version` | integer — matches `quizzes.print_version` at generation time |
| `created_at`/`updated_at` | timestamptz |

Unique on `(quiz_id, student_id, template_version)` — this is what makes
variant generation idempotent. **Option order within a question is never
shuffled**, only the order questions appear on the sheet — so
`question_options.order_index` (which the OMR service reports back as
`detected_option_index`) always means the same physical bubble position
regardless of variant.

### `omr_scans` (uploaded sheet images + scoring)
| Column | Type |
|---|---|
| `id` | uuid pk |
| `variant_id` | uuid → `quiz_variants(id)` |
| `image_storage_path` | text — path within the `omr-scans` storage bucket |
| `status` | enum `omr_scan_status`: `pending`, `processing`, `scored`, `needs_review`, `error` |
| `raw_omr_result` | jsonb — whatever the Python service returned, for audit/debugging |
| `error_message` | text, nullable |
| `total_questions`, `total_correct`, `score_pct` | materialized at scoring time (see below) |
| `scored_at` | timestamptz |
| `uploaded_by` | uuid → `profiles(id)` |
| `uploaded_at`, `created_at`, `updated_at` | timestamptz |

No uniqueness constraint on `variant_id` — a sheet can be re-uploaded (e.g.
blurry first photo) as a new row; treat the most recent row per `variant_id`
as current.

### `omr_scan_responses`
| Column | Type |
|---|---|
| `id` | uuid pk |
| `scan_id` | uuid → `omr_scans(id)` |
| `question_id` | uuid → `questions(id)` |
| `detected_option_index` | smallint — matches `question_options.order_index` |
| `confidence` | real (0–1) |
| `is_correct` | boolean, computed once at scoring time |

Unique on `(scan_id, question_id)`.

## The locking/versioning decision

**Chosen: lock, not snapshot.** Once any variant has been printed for a quiz
(`quizzes.locked_at is not null`), a DB trigger
(`prevent_locked_quiz_question_edit`, on `questions` and `question_options`)
blocks insert/update/delete on that quiz's questions and options. The owner
must explicitly call `unlock_quiz_for_editing(quiz_id)` to edit — the intended
UX is a confirmation checkbox in the print dialog ("printing locks this quiz;
edit it later only if you understand you'll need to reprint"), and a similar
confirmation before unlocking.

This was chosen over full snapshotting because the same `quizzes`/`questions`
tables are shared with the live online-quiz feature — snapshotting would add
storage/complexity for a use case (paper exams) that must not restrict how
freely the underlying quiz can keep being edited for online use. Locking is
simpler and matches how the feature will actually be used: print, hand out
sheets, then either move on or unlock-edit-reprint.

**Why edits after unlock don't corrupt already-scored sheets:** `omr_scans`
stores `total_correct`/`total_questions`/`score_pct` as materialized columns,
computed once by `record_omr_scan_result` using live `question_options.is_correct`
*at the moment of scoring*. They are never recomputed from a live view, so a
later edit (post-unlock) can never retroactively change a historical score.
Old, already-printed `quiz_variants` rows (from a prior `template_version`)
are kept forever for audit — they are not deleted or migrated when the quiz
is unlocked and reprinted; a fresh print run just creates new variant rows
under a new `template_version` for every currently-registered student.

Tradeoff to be aware of: if an instructor unlocks, edits a question's correct
answer, and then re-scans a sheet from the *old* (pre-edit) print run before
reprinting, that sheet would score against the *new* answer. This is an
accepted edge case given the workflow (edit → must reprint before continuing
to collect/score sheets); it is not prevented at the DB level.

## RLS summary

Everything routes through the existing `can_manage_quiz(quiz_id)` helper
(owner `quizzes.user_id` OR `is_admin()` OR `is_school_editor(quizzes.school_id)`).
No new helper functions duplicate that logic except:
- `can_manage_omr_scan(scan_id)` — resolves `scan → variant → quiz` then
  delegates to `can_manage_quiz`.
- `quiz_registration_open(quiz_id)` — `registration_deadline is null or > now()`.

| Table | Select | Insert | Update | Delete |
|---|---|---|---|---|
| `quiz_registrations` | self row OR `can_manage_quiz` | self (if `quiz_registration_open`) OR owner (anytime) | — | self OR owner |
| `quiz_variants` | self row OR `can_manage_quiz` | owner only (normally via `generate_quiz_variants`) | owner only | owner only |
| `omr_scans` | `can_manage_quiz` via variant | owner, `uploaded_by = auth.uid()` | owner | — |
| `omr_scan_responses` | `can_manage_omr_scan` | `can_manage_omr_scan` | `can_manage_omr_scan` | — |

No policy exposes `question_options.is_correct` or `omr_scan_responses.is_correct`
to students. `record_omr_scan_result` and `mark_omr_scan_error` are revoked
from `anon`/`authenticated` entirely and only callable by `service_role`,
since they're meant to be invoked by the Next.js server route after calling
the external OMR service, not directly by a browser session.

## Storage

Bucket: **`omr-scans`** (private, `public = false`).

Path convention: `omr-scans/{quiz_id}/{variant_id}/{filename}`

`storage.objects` RLS (select/insert/delete) checks
`can_manage_quiz(((storage.foldername(name))[1])::uuid)` — i.e. the first
path segment must be a quiz the caller manages. No update policy — re-upload
as a new object/new `omr_scans` row instead of overwriting.

## Function contracts

### `generate_quiz_variants(p_quiz_id uuid, p_shuffle boolean default false, p_user_id uuid default auth.uid()) returns setof quiz_variants`
Print action. Requires `can_manage_quiz(p_quiz_id)`. Creates one `quiz_variants`
row per currently-registered student who doesn't already have one for the
quiz's current `print_version` (idempotent — safe to call repeatedly as more
students register). Locks the quiz (`locked_at = now()`, `print_version += 1`)
the first time it's called for a given unlocked state. Raises if the quiz has
no questions or no registrations. Returns all variants for the current
`print_version` (i.e. the full current print run, not just newly-created
rows) so the caller can immediately render/download every sheet.

### `unlock_quiz_for_editing(p_quiz_id uuid, p_user_id uuid default auth.uid()) returns quizzes`
Requires `can_manage_quiz(p_quiz_id)`. Sets `locked_at = null`. Does not touch
existing `quiz_variants`/`omr_scans` — those remain as history. The next
`generate_quiz_variants` call will bump `print_version` and create a fresh
variant for every currently-registered student.

### `create_omr_scan(p_variant_id uuid, p_image_storage_path text, p_user_id uuid default auth.uid()) returns omr_scans`
Called by the dashboard immediately after the browser uploads an image to the
`omr-scans` bucket. Requires `can_manage_quiz` on the variant's quiz. Inserts
a `status = 'pending'` row. **Request**: variant id (decoded from the sheet's
QR code) + the storage path just uploaded to. **Response**: the full
`omr_scans` row (id needed for the next step).

### External call (application-layer, not a Postgres function)
The Next.js API route, after `create_omr_scan`, is responsible for calling
the external Python OMR service (HTTPS endpoint via env var) with:
```jsonc
{
  "scan_id": "uuid",
  "image_url": "signed URL to the uploaded image",
  "question_order": ["uuid", "uuid", "..."],  // quiz_variants.question_order
  "template_version": 1
}
```
Expected service response shape (what the route should pass into
`record_omr_scan_result`):
```jsonc
{
  "responses": [
    { "question_id": "uuid", "detected_option_index": 0, "confidence": 0.95 },
    { "question_id": "uuid", "detected_option_index": null, "confidence": 0.10 }
  ],
  "raw": { /* whatever the service wants to hand back for audit */ }
}
```

### `record_omr_scan_result(p_scan_id uuid, p_responses jsonb, p_raw_result jsonb default null, p_confidence_threshold real default 0.75) returns omr_scans`
Called by the Next.js route **using the service-role client** after a
successful OMR service response — not exposed to `authenticated`/`anon`.
Replaces any existing `omr_scan_responses` for the scan, computes
`is_correct` per response by comparing `detected_option_index` against
`question_options.order_index`/`is_correct` for that question, sets
`total_questions`/`total_correct`/`score_pct` (frozen from then on), and sets
`status` to `needs_review` if any response's confidence is below
`p_confidence_threshold` (default 0.75), else `scored`.

### `mark_omr_scan_error(p_scan_id uuid, p_error_message text) returns omr_scans`
Called by the Next.js route (service role) when the external OMR call fails
or throws. Sets `status = 'error'` and stores the message. The uploaded image
and the `omr_scans` row are untouched — the dashboard can retry (call the
external service again for the same `scan_id`/image) without re-uploading.

## What the dashboard/API layer still needs to build (not part of this task)
- Print dialog UI: confirm-checkbox → call `generate_quiz_variants` → render/
  download one PDF per returned variant, encoding a QR code of `variant_id`.
- Upload UI: decode QR → upload image to `omr-scans/{quiz_id}/{variant_id}/...`
  → call `create_omr_scan` → call the Next.js API route that owns the
  Python-service round trip and the `record_omr_scan_result`/
  `mark_omr_scan_error` calls.
- A "needs review" queue view for `omr_scans.status = 'needs_review'`, letting
  an instructor manually confirm/correct low-confidence
  `omr_scan_responses.detected_option_index` values.
