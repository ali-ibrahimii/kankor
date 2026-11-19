-- ─────────────────────────────────────────────────────────────────────────
-- Fix quiz & question deletion: ON DELETE CASCADE, RLS & delete_quiz_cascade
--
-- Core quiz child foreign keys (`questions_quiz_id_fkey`,
-- `question_options_question_id_fkey`, `quiz_attempts_quiz_id_fkey`,
-- `answers_question_id_fkey`, `answers_quiz_attempt_id_fkey`) were created
-- with NO ACTION, causing deleting any quiz with questions or attempts to
-- fail with:
--   update or delete on table "quizzes" violates foreign key constraint
--   "questions_quiz_id_fkey" on table "questions"
--
-- This migration:
-- 1. Backfills legacy null `question_options.quiz_id` from `questions.quiz_id`.
-- 2. Converts all quiz-owned child foreign keys to `ON DELETE CASCADE`
--    (`lesson_content_blocks.quiz_id` remains `ON DELETE SET NULL` so course
--    lessons survive quiz deletion).
-- 3. Cleans polymorphic references (`classroom_resources`,
--    `courses.related_quizzes_ids`) automatically after a quiz is deleted.
-- 4. Aligns DELETE RLS policies on `quizzes`, `question_options`,
--    `quiz_attempts`, and `answers` with `public.can_manage_quiz`.
-- 5. Provides `public.delete_quiz_cascade(p_quiz_id)` for atomic, authorized
--    deletion (including quizzes locked by a previous OMR print run).
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Backfill legacy question_options.quiz_id --------------------------------

do $$
declare
  v_has_lock_trigger boolean;
begin
  select exists (
    select 1
    from pg_trigger
    where tgname = 'prevent_edit_when_quiz_locked'
      and tgrelid = 'public.question_options'::regclass
      and not tgisinternal
  ) into v_has_lock_trigger;

  if v_has_lock_trigger then
    execute 'alter table public.question_options disable trigger prevent_edit_when_quiz_locked';
  end if;

  update public.question_options qo
  set quiz_id = q.quiz_id
  from public.questions q
  where qo.question_id = q.id
    and qo.quiz_id is null
    and q.quiz_id is not null;

  if v_has_lock_trigger then
    execute 'alter table public.question_options enable trigger prevent_edit_when_quiz_locked';
  end if;
end;
$$;

-- 2. Convert quiz-owned child foreign keys to ON DELETE CASCADE --------------

alter table public.questions
  drop constraint if exists questions_quiz_id_fkey,
  add constraint questions_quiz_id_fkey
    foreign key (quiz_id) references public.quizzes (id) on delete cascade;

alter table public.question_options
  drop constraint if exists question_options_question_id_fkey,
  add constraint question_options_question_id_fkey
    foreign key (question_id) references public.questions (id) on delete cascade;

alter table public.question_options
  drop constraint if exists question_options_quiz_id_fkey,
  add constraint question_options_quiz_id_fkey
    foreign key (quiz_id) references public.quizzes (id) on delete cascade;

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_quiz_id_fkey,
  add constraint quiz_attempts_quiz_id_fkey
    foreign key (quiz_id) references public.quizzes (id) on delete cascade;

alter table public.answers
  drop constraint if exists answers_question_id_fkey,
  add constraint answers_question_id_fkey
    foreign key (question_id) references public.questions (id) on delete cascade;

alter table public.answers
  drop constraint if exists answers_quiz_attempt_id_fkey,
  add constraint answers_quiz_attempt_id_fkey
    foreign key (quiz_attempt_id) references public.quiz_attempts (id) on delete cascade;

-- 3. Cleanup soft/polymorphic quiz references on quiz deletion ---------------

create or replace function public.cleanup_deleted_quiz_references()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  delete from public.classroom_resources
  where resource_type = 'quiz'::public.shareable_type
    and resource_id = old.id;

  update public.courses
  set related_quizzes_ids = array_remove(related_quizzes_ids, old.id)
  where old.id = any(related_quizzes_ids);

  return old;
end;
$function$;

drop trigger if exists trg_cleanup_deleted_quiz_references on public.quizzes;
create trigger trg_cleanup_deleted_quiz_references
  after delete on public.quizzes
  for each row
  execute function public.cleanup_deleted_quiz_references();

-- 4. Align DELETE RLS policies for quiz managers -----------------------------

drop policy if exists "Quiz managers can delete quizzes" on public.quizzes;
create policy "Quiz managers can delete quizzes"
  on public.quizzes
  as permissive
  for delete
  to authenticated
  using (public.can_manage_quiz(id, (select auth.uid())));

drop policy if exists "Owner, admin, and school editor can delete a quiz question_opti" on public.question_options;
create policy "Owner, admin, and school editor can delete a quiz question_opti"
  on public.question_options
  as permissive
  for delete
  to authenticated
  using (
    public.can_manage_quiz(
      coalesce(
        quiz_id,
        (select q.quiz_id from public.questions q where q.id = question_options.question_id)
      ),
      (select auth.uid())
    )
  );

drop policy if exists "Quiz managers can delete quiz attempts" on public.quiz_attempts;
create policy "Quiz managers can delete quiz attempts"
  on public.quiz_attempts
  as permissive
  for delete
  to authenticated
  using (public.can_manage_quiz(quiz_id, (select auth.uid())));

drop policy if exists "Quiz managers can delete quiz answers" on public.answers;
create policy "Quiz managers can delete quiz answers"
  on public.answers
  as permissive
  for delete
  to authenticated
  using (
    public.can_manage_quiz(
      coalesce(
        (select q.quiz_id from public.questions q where q.id = answers.question_id),
        (select qa.quiz_id from public.quiz_attempts qa where qa.id = answers.quiz_attempt_id)
      ),
      (select auth.uid())
    )
  );

-- 5. Atomic authorized delete RPC --------------------------------------------

create or replace function public.delete_quiz_cascade(p_quiz_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'Unauthenticated';
  end if;

  if p_quiz_id is null then
    raise exception 'quiz_not_found';
  end if;

  select exists (select 1 from public.quizzes q where q.id = p_quiz_id)
    into v_exists;

  if not v_exists then
    raise exception 'quiz_not_found';
  end if;

  if not public.can_manage_quiz(p_quiz_id, v_uid) then
    raise exception 'Permission denied: cannot delete this quiz.';
  end if;

  -- Clear any OMR print lock so question/option triggers never block deletion.
  update public.quizzes
  set locked_at = null
  where id = p_quiz_id
    and locked_at is not null;

  -- Detach any course content blocks explicitly (also covered by ON DELETE SET NULL).
  update public.lesson_content_blocks
  set quiz_id = null,
      updated_at = now()
  where quiz_id = p_quiz_id;

  delete from public.quizzes
  where id = p_quiz_id;

  return true;
end;
$function$;

revoke all on function public.delete_quiz_cascade(uuid) from public;
grant execute on function public.delete_quiz_cascade(uuid) to authenticated;
