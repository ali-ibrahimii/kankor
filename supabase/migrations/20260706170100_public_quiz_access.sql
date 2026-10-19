-- Quizzes default to visibility = 'public' but anon SELECT was fully revoked
-- during the RLS review pass, and the one "public" read policy is scoped to
-- authenticated only. Expose public quizzes to signed-out visitors the same
-- way public decks already are (see 20260705120000_add_global_search.sql).
--
-- This only grants row-level access to the `quizzes` table itself. Sensitive
-- child tables (questions, question_options, answers) are untouched and stay
-- inaccessible to anon. Application queries against `quizzes` must still
-- avoid selecting `entrance_code` even though the row is now readable, since
-- RLS controls rows, not columns.
grant select on table "public"."quizzes" to "anon";

create policy "Anonymous users can view public quizzes"
on "public"."quizzes"
as permissive
for select
to anon
using (visibility = 'public'::public.visibility);

create index if not exists idx_quizzes_title_trgm
  on public.quizzes using gin (title extensions.gin_trgm_ops);
