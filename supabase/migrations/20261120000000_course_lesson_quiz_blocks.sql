-- ─────────────────────────────────────────────────────────────────────────
-- Course lesson quiz blocks, chapter completion gating, and quiz visibility
--
-- 1. `lesson_content_blocks.quiz_id`: links a `quiz` content block inside a
--    course lesson to any quiz (resolved by entrance code, link/slug, or id).
-- 2. `quizzes.course_id`: optional direct course association when creating a
--    non-public (course-only) quiz, restricting attachment & access to that
--    specific course (when null and visibility = 'private', any instructor or
--    admin with the quiz code can attach it to a course).
-- 3. `quiz_registration_open` + `start_standalone_quiz_attempt`: prevent
--    public self-registration or standalone access on course-only quizzes.
-- 4. Lesson & chapter gating helpers (`lesson_has_quiz`,
--    `has_user_passed_lesson_quizzes`, `is_lesson_unlocked_for_user`):
--    mandatory quiz lessons must be passed to complete the lesson and to
--    unlock any subsequent module (chapter) in the course.
-- 5. Secure RPCs:
--    - `resolve_quiz_for_course_block` (instructor/admin block editor)
--    - `get_lesson_quiz_state` (student quiz card & active attempt hydration)
--    - `start_lesson_quiz_attempt` (start or resume a lesson quiz attempt)
--    - `submit_lesson_quiz_attempt` (atomic grading, completion & feedback)
-- 6. `complete_lesson_for_user` & `get_course_details`: enforce quiz/chapter
--    gates server-side and expose `is_mandatory`, `has_quiz`, `quiz_passed`
--    on lesson objects for client navigation/sidebar locking.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Schema columns & indexes ------------------------------------------------

alter table public.lesson_content_blocks
  add column if not exists quiz_id uuid references public.quizzes (id) on delete set null;

create index if not exists idx_lesson_content_blocks_quiz_id
  on public.lesson_content_blocks (quiz_id)
  where quiz_id is not null;

alter table public.quizzes
  add column if not exists course_id uuid references public.courses (id) on delete set null;

create index if not exists idx_quizzes_course_id
  on public.quizzes (course_id)
  where course_id is not null;

-- 2. Permission helpers & admin view -----------------------------------------

create or replace function public.can_edit_course_content(
  p_course_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_agency_id uuid;
begin
  if p_course_id is null or p_user_id is null then
    return false;
  end if;

  if public.can_manage_course(p_course_id, null, p_user_id) then
    return true;
  end if;

  select c.agency_id
    into v_agency_id
  from public.courses c
  where c.id = p_course_id;

  if v_agency_id is not null
     and public.is_agency_content_editor(v_agency_id, 'courses.manage_own', p_user_id) then
    return true;
  end if;

  return public.agency_can_manage_any('courses.manage_any', p_course_id, p_user_id);
end;
$function$;

grant execute on function public.can_edit_course_content(uuid, uuid) to authenticated;

create or replace function public.can_manage_quiz(
  p_quiz_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_owner_id uuid;
  v_school_id uuid;
  v_agency_id uuid;
  v_course_id uuid;
  v_lesson_id uuid;
begin
  if p_quiz_id is null or p_user_id is null then
    return false;
  end if;

  select
    q.user_id,
    q.school_id,
    q.agency_id,
    q.course_id,
    q.lesson_id
  into
    v_owner_id,
    v_school_id,
    v_agency_id,
    v_course_id,
    v_lesson_id
  from public.quizzes q
  where q.id = p_quiz_id;

  if not found then
    return false;
  end if;

  if v_owner_id is not null and v_owner_id = p_user_id then
    return true;
  end if;

  if public.is_admin(p_user_id) then
    return true;
  end if;

  if v_school_id is not null
     and public.is_school_editor(v_school_id, p_user_id) then
    return true;
  end if;

  if v_agency_id is not null
     and public.is_agency_content_editor(v_agency_id, 'quizzes.manage_own', p_user_id) then
    return true;
  end if;

  if public.agency_can_manage_any('quizzes.manage_any', p_quiz_id, p_user_id) then
    return true;
  end if;

  if v_course_id is not null
     and public.can_edit_course_content(v_course_id, p_user_id) then
    return true;
  end if;

  if v_lesson_id is not null
     and public.is_course_instructor(public.get_course_id_from_lesson(v_lesson_id), p_user_id) then
    return true;
  end if;

  return false;
end;
$function$;

drop policy if exists "Course managers can view course-scoped quizzes" on public.quizzes;
create policy "Course managers can view course-scoped quizzes"
  on public.quizzes
  as permissive
  for select
  to authenticated
  using (
    course_id is not null
    and public.can_edit_course_content(course_id, (select auth.uid()))
  );

-- Keep exact column order & types of admin_quizzes_view while resolving
-- `course_id` / `course_title` from `quizzes.course_id` when set directly.
create or replace view public.admin_quizzes_view
with (security_invoker = on) as
select
  q.id,
  q.title,
  q.description,
  q.time_limit_minutes,
  q.passing_score_percentage,
  q.max_attempts,
  q.shuffle_questions,
  q.show_correct_answers_after,
  q.instructions,
  q.school_id,
  q.entrance_code,
  q.lesson_id,
  q.slug,
  q.user_id,
  q.visibility,
  q.is_free,
  q.price_credits,
  q.seo_title,
  q.seo_description,
  q.created_at,
  q.updated_at,
  l.title as lesson_title,
  coalesce(q.course_id, l.course_id) as course_id,
  crs.title as course_title,
  sch.name as school_name,
  p.full_name as owner_name,
  p.email as owner_email,
  (
    select count(*)
    from public.questions qn
    where qn.quiz_id = q.id
  ) as question_count
from public.quizzes q
left join public.lessons l on l.id = q.lesson_id
left join public.courses crs on crs.id = coalesce(q.course_id, l.course_id)
left join public.schools sch on sch.id = q.school_id
left join public.profiles p on p.id = q.user_id;

grant select on public.admin_quizzes_view to authenticated;

-- 3. Guard public self-registration & standalone attempts --------------------

create or replace function public.quiz_registration_open(p_quiz_id uuid)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select coalesce(
    (
      select q.visibility = 'public'::public.visibility
        and (q.registration_deadline is null or q.registration_deadline > now())
      from public.quizzes q
      where q.id = p_quiz_id
    ),
    false
  );
$function$;

create or replace function public.start_standalone_quiz_attempt(
  p_entrance_code text,
  p_user_id uuid default auth.uid()
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  found_quiz public.quizzes;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Permission denied.';
  end if;

  found_quiz := public.get_quiz_by_entrance_code(p_entrance_code);

  if found_quiz.lesson_id is not null
     or found_quiz.course_id is not null
     or found_quiz.visibility <> 'public'::public.visibility then
    raise exception 'Quiz "%" is restricted to a course and cannot be started standalone.', found_quiz.title;
  end if;

  return public.start_quiz_attempt(found_quiz.id, p_user_id);
end;
$function$;

-- 4. Lesson quiz & chapter-locking helpers -----------------------------------

create or replace function public.is_quiz_attached_to_lesson(
  p_lesson_id uuid,
  p_quiz_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select p_lesson_id is not null
    and p_quiz_id is not null
    and (
      exists (
        select 1
        from public.lesson_content_blocks b
        where b.lesson_id = p_lesson_id
          and b.block_type = 'quiz'::public.lesson_content_type
          and b.quiz_id = p_quiz_id
      )
      or exists (
        select 1
        from public.quizzes q
        where q.id = p_quiz_id
          and q.lesson_id = p_lesson_id
      )
    );
$function$;

create or replace function public.lesson_has_quiz(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select p_lesson_id is not null
    and (
      exists (
        select 1
        from public.lesson_content_blocks b
        where b.lesson_id = p_lesson_id
          and b.block_type = 'quiz'::public.lesson_content_type
          and b.quiz_id is not null
      )
      or exists (
        select 1
        from public.quizzes q
        where q.lesson_id = p_lesson_id
      )
    );
$function$;

create or replace function public.has_user_passed_lesson_quizzes(
  p_lesson_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_quiz_id uuid;
  v_has_any boolean := false;
begin
  if p_lesson_id is null then
    return true;
  end if;

  for v_quiz_id in
    select distinct q_ids.quiz_id
    from (
      select b.quiz_id
      from public.lesson_content_blocks b
      where b.lesson_id = p_lesson_id
        and b.block_type = 'quiz'::public.lesson_content_type
        and b.quiz_id is not null
      union
      select q.id as quiz_id
      from public.quizzes q
      where q.lesson_id = p_lesson_id
    ) q_ids
  loop
    v_has_any := true;

    if p_user_id is null then
      return false;
    end if;

    if not exists (
      select 1
      from public.quiz_attempts qa
      where qa.quiz_id = v_quiz_id
        and qa.user_id = p_user_id
        and qa.completed_at is not null
        and qa.passed = true
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$function$;

create or replace function public.is_lesson_unlocked_for_user(
  p_lesson_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_course_id uuid;
  v_module_id uuid;
  v_mod_order integer;
begin
  if p_lesson_id is null then
    return false;
  end if;

  select l.course_id, l.module_id, m.order_index
    into v_course_id, v_module_id, v_mod_order
  from public.lessons l
  left join public.modules m on m.id = l.module_id
  where l.id = p_lesson_id;

  if not found then
    return false;
  end if;

  -- Lessons without a module cannot be gated by prior modules.
  if v_module_id is null or v_course_id is null then
    return true;
  end if;

  -- Course managers (instructor, admin, school/agency editor) are never locked.
  if p_user_id is not null and public.can_edit_course_content(v_course_id, p_user_id) then
    return true;
  end if;

  -- Any earlier module with an unpassed mandatory quiz locks this lesson.
  if exists (
    select 1
    from public.modules m_prev
    join public.lessons l_prev on l_prev.module_id = m_prev.id
    where m_prev.course_id = v_course_id
      and m_prev.id <> v_module_id
      and (
        m_prev.order_index < v_mod_order
        or (m_prev.order_index = v_mod_order and m_prev.id::text < v_module_id::text)
      )
      and coalesce(l_prev.is_mandatory, true) = true
      and public.lesson_has_quiz(l_prev.id)
      and not public.has_user_passed_lesson_quizzes(l_prev.id, p_user_id)
  ) then
    return false;
  end if;

  return true;
end;
$function$;

grant execute on function public.is_quiz_attached_to_lesson(uuid, uuid) to authenticated;
grant execute on function public.lesson_has_quiz(uuid) to anon, authenticated;
grant execute on function public.has_user_passed_lesson_quizzes(uuid, uuid) to authenticated;
grant execute on function public.is_lesson_unlocked_for_user(uuid, uuid) to authenticated;

-- Enforce chapter lock on enrolled student reads of lesson_content_blocks
-- (course managers still read via their dedicated can_view_course policy).
drop policy if exists "Anyone can view a published course lesson content" on public.lesson_content_blocks;
create policy "Anyone can view a published course lesson content"
  on public.lesson_content_blocks
  as permissive
  for select
  to authenticated
  using (
    public.is_course_published(course_id)
    and public.is_enrolled(course_id)
    and (
      lesson_id is null
      or public.is_lesson_unlocked_for_user(lesson_id, (select auth.uid()))
    )
  );

-- 5. Resolve quiz for course block (builder action) --------------------------

create or replace function public.resolve_quiz_for_course_block(
  p_course_id uuid,
  p_code text default null,
  p_slug text default null,
  p_quiz_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_quiz public.quizzes;
  v_matched_by_code boolean := false;
  v_code text := nullif(upper(btrim(coalesce(p_code, ''))), '');
  v_slug text := nullif(btrim(coalesce(p_slug, '')), '');
  v_course_title text;
  v_question_count integer;
begin
  if v_uid is null then
    raise exception 'Unauthenticated';
  end if;

  if p_course_id is null or not public.can_edit_course_content(p_course_id, v_uid) then
    raise exception 'Permission denied: cannot manage this course.';
  end if;

  if p_quiz_id is not null then
    select * into v_quiz
    from public.quizzes q
    where q.id = p_quiz_id;
  end if;

  if v_quiz.id is null and v_code is not null then
    select * into v_quiz
    from public.quizzes q
    where upper(q.entrance_code) = v_code;
    if v_quiz.id is not null then
      v_matched_by_code := true;
    end if;
  end if;

  if v_quiz.id is null and v_slug is not null then
    select * into v_quiz
    from public.quizzes q
    where q.slug = v_slug;

    if v_quiz.id is null then
      select * into v_quiz
      from public.quizzes q
      where upper(q.entrance_code) = upper(v_slug);
      if v_quiz.id is not null then
        v_matched_by_code := true;
      end if;
    end if;
  end if;

  if v_quiz.id is null then
    return null;
  end if;

  -- If the quiz creator locked this quiz to a specific course, prevent using
  -- it in any other course (even with its entrance code), unless the caller
  -- is not authorized to see it at all.
  if v_quiz.course_id is not null and v_quiz.course_id <> p_course_id then
    if v_matched_by_code or public.can_manage_quiz(v_quiz.id, v_uid) or v_quiz.visibility = 'public'::public.visibility then
      raise exception 'quiz_bound_to_other_course';
    end if;
    return null;
  end if;

  -- Without a valid entrance code, private quizzes are only resolvable by
  -- their managers, the target course's managers (when assigned), or when
  -- already attached to a block in this course.
  if not v_matched_by_code
     and v_quiz.visibility <> 'public'::public.visibility
     and not public.can_manage_quiz(v_quiz.id, v_uid)
     and v_quiz.course_id is distinct from p_course_id
     and not exists (
       select 1
       from public.lesson_content_blocks b
       where b.course_id = p_course_id
         and b.quiz_id = v_quiz.id
     ) then
    return null;
  end if;

  if v_quiz.course_id is not null then
    select c.title into v_course_title
    from public.courses c
    where c.id = v_quiz.course_id;
  end if;

  select count(*)::integer into v_question_count
  from public.questions qn
  where qn.quiz_id = v_quiz.id;

  return jsonb_build_object(
    'id', v_quiz.id,
    'title', v_quiz.title,
    'description', v_quiz.description,
    'entrance_code', v_quiz.entrance_code,
    'slug', v_quiz.slug,
    'visibility', v_quiz.visibility,
    'course_id', v_quiz.course_id,
    'course_title', v_course_title,
    'question_count', v_question_count,
    'passing_score_percentage', v_quiz.passing_score_percentage,
    'time_limit_minutes', v_quiz.time_limit_minutes,
    'max_attempts', v_quiz.max_attempts,
    'shuffle_questions', coalesce(v_quiz.shuffle_questions, false),
    'show_correct_answers_after', v_quiz.show_correct_answers_after
  );
end;
$function$;

revoke all on function public.resolve_quiz_for_course_block(uuid, text, text, uuid) from public;
grant execute on function public.resolve_quiz_for_course_block(uuid, text, text, uuid) to authenticated;

-- 6. Student lesson quiz runner RPCs -----------------------------------------

create or replace function public.get_lesson_quiz_state(
  p_lesson_id uuid,
  p_quiz_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_lesson public.lessons;
  v_quiz public.quizzes;
  v_is_manager boolean;
  v_is_enrolled boolean;
  v_question_count integer;
  v_total_points numeric(8,2);
  v_active public.quiz_attempts;
  v_expired_score numeric(8,2);
  v_expired_manual integer;
  v_expired_passed boolean;
  v_attempts_json jsonb;
  v_active_json jsonb := null;
  v_questions_json jsonb;
  v_attempts_used integer;
  v_has_passed boolean;
  v_remaining integer;
  v_expires_at timestamptz;
begin
  if v_uid is null then
    raise exception 'Unauthenticated';
  end if;

  select * into v_lesson
  from public.lessons l
  where l.id = p_lesson_id;

  if not found or v_lesson.course_id is null then
    raise exception 'lesson_not_found';
  end if;

  if not public.is_quiz_attached_to_lesson(p_lesson_id, p_quiz_id) then
    raise exception 'quiz_not_in_lesson';
  end if;

  select * into v_quiz
  from public.quizzes q
  where q.id = p_quiz_id;

  if not found then
    raise exception 'quiz_not_found';
  end if;

  if v_quiz.course_id is not null and v_quiz.course_id <> v_lesson.course_id then
    raise exception 'quiz_bound_to_other_course';
  end if;

  v_is_manager := public.can_edit_course_content(v_lesson.course_id, v_uid);
  v_is_enrolled := public.is_enrolled(v_lesson.course_id, v_uid);

  if not v_is_enrolled and not v_is_manager then
    raise exception 'not_enrolled';
  end if;

  if not public.is_lesson_unlocked_for_user(p_lesson_id, v_uid) then
    raise exception 'chapter_locked';
  end if;

  -- Finalize any timed-out uncompleted attempt so the learner is never stuck.
  if v_quiz.time_limit_minutes is not null and v_quiz.time_limit_minutes > 0 then
    for v_active in
      select *
      from public.quiz_attempts qa
      where qa.quiz_id = p_quiz_id
        and qa.user_id = v_uid
        and qa.completed_at is null
        and qa.started_at is not null
        and now() > qa.started_at + make_interval(mins => v_quiz.time_limit_minutes) + interval '5 seconds'
    loop
      select coalesce(sum(a.points_awarded), 0),
             count(*) filter (where a.is_correct is null)
        into v_expired_score, v_expired_manual
      from public.answers a
      where a.quiz_attempt_id = v_active.id;

      if v_expired_manual > 0 then
        v_expired_passed := null;
      elsif v_quiz.passing_score_percentage is null or coalesce(v_active.max_score_possible, 0) <= 0 then
        v_expired_passed := (v_expired_score > 0 or coalesce(v_active.max_score_possible, 0) <= 0);
      else
        v_expired_passed := ((v_expired_score * 100.0) / v_active.max_score_possible) >= v_quiz.passing_score_percentage;
      end if;

      update public.quiz_attempts
      set score = v_expired_score,
          passed = v_expired_passed,
          completed_at = now(),
          updated_at = now()
      where id = v_active.id;
    end loop;
  end if;

  select count(*)::integer, coalesce(sum(coalesce(qn.points, 1)), 0)
    into v_question_count, v_total_points
  from public.questions qn
  where qn.quiz_id = p_quiz_id;

  select
    count(*)::integer,
    coalesce(bool_or(qa.passed = true), false),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', qa.id,
          'attempt_number', qa.attempt_number,
          'score', qa.score,
          'max_score_possible', qa.max_score_possible,
          'passed', qa.passed,
          'started_at', qa.started_at,
          'completed_at', qa.completed_at,
          'awaiting_manual_grade', (qa.completed_at is not null and qa.passed is null)
        )
        order by qa.attempt_number desc
      ),
      '[]'::jsonb
    )
  into v_attempts_used, v_has_passed, v_attempts_json
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.user_id = v_uid
    and qa.completed_at is not null;

  if v_quiz.max_attempts is not null then
    v_remaining := greatest(0, v_quiz.max_attempts - v_attempts_used);
  else
    v_remaining := null;
  end if;

  -- Check for a live in-progress attempt and hydrate its sanitized questions.
  select * into v_active
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.user_id = v_uid
    and qa.completed_at is null
  order by qa.created_at desc
  limit 1;

  if found then
    if v_quiz.time_limit_minutes is not null and v_quiz.time_limit_minutes > 0 and v_active.started_at is not null then
      v_expires_at := v_active.started_at + make_interval(mins => v_quiz.time_limit_minutes);
    else
      v_expires_at := null;
    end if;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', qn.id,
          'question_text', qn.question_text,
          'question_type', qn.question_type,
          'order_index', qn.order_index,
          'points', coalesce(qn.points, 1),
          'hint', qn.hint,
          'image_url', img_block.image_url,
          'allow_multiple', (
            qn.question_type = 'multiple_choice_multiple_correct'::public.question_type
            or (
              qn.question_type = 'image_based_question'::public.question_type
              and (
                select count(*)
                from public.question_options qo_c
                where qo_c.question_id = qn.id and qo_c.is_correct = true
              ) > 1
            )
          ),
          'blank_count', case
            when qn.question_type = 'fill_in_the_blanks'::public.question_type then (
              select greatest(1, count(*)::integer)
              from public.question_options qo_b
              where qo_b.question_id = qn.id
            )
            else 0
          end,
          'options', case
            when qn.question_type in (
              'fill_in_the_blanks'::public.question_type,
              'short_answer_text'::public.question_type,
              'long_answer_text'::public.question_type
            ) then '[]'::jsonb
            when qn.question_type = 'ordering'::public.question_type then (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', qo.id,
                    'option_text', qo.option_text,
                    'order_index', row_number_val
                  )
                  order by sort_hash
                ),
                '[]'::jsonb
              )
              from (
                select
                  qo.id,
                  qo.option_text,
                  md5(qo.id::text || ':' || v_active.id::text) as sort_hash,
                  row_number() over (order by md5(qo.id::text || ':' || v_active.id::text)) - 1 as row_number_val
                from public.question_options qo
                where qo.question_id = qn.id
              ) qo
            )
            else (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', qo.id,
                    'option_text', qo.option_text,
                    'order_index', coalesce(qo.order_index, 0)
                  )
                  order by coalesce(qo.order_index, 0) asc, qo.id asc
                ),
                '[]'::jsonb
              )
              from public.question_options qo
              where qo.question_id = qn.id
            )
          end,
          'match_targets', case
            when qn.question_type = 'matching'::public.question_type then (
              select coalesce(
                jsonb_agg(mt.match_target_text order by mt.sort_hash),
                '[]'::jsonb
              )
              from (
                select
                  qo.match_target_text,
                  md5(coalesce(qo.match_target_text, '') || ':' || qo.id::text || ':' || v_active.id::text) as sort_hash
                from public.question_options qo
                where qo.question_id = qn.id
                  and qo.match_target_text is not null
              ) mt
            )
            else '[]'::jsonb
          end
        )
        order by
          case
            when coalesce(v_quiz.shuffle_questions, false)
              then md5(qn.id::text || ':' || v_active.id::text)
            else lpad(greatest(0, qn.order_index)::text, 8, '0') || ':' || qn.id::text
          end asc
      ),
      '[]'::jsonb
    )
    into v_questions_json
    from public.questions qn
    left join public.lesson_content_blocks img_block on img_block.id = qn.image_content_block_id
    where qn.quiz_id = p_quiz_id;

    v_active_json := jsonb_build_object(
      'id', v_active.id,
      'attempt_number', v_active.attempt_number,
      'started_at', coalesce(v_active.started_at, v_active.created_at),
      'expires_at', v_expires_at,
      'max_score_possible', coalesce(v_active.max_score_possible, v_total_points),
      'questions', v_questions_json
    );
  end if;

  return jsonb_build_object(
    'quiz', jsonb_build_object(
      'id', v_quiz.id,
      'title', v_quiz.title,
      'description', v_quiz.description,
      'instructions', v_quiz.instructions,
      'time_limit_minutes', v_quiz.time_limit_minutes,
      'max_attempts', v_quiz.max_attempts,
      'passing_score_percentage', v_quiz.passing_score_percentage,
      'shuffle_questions', coalesce(v_quiz.shuffle_questions, false),
      'show_correct_answers_after', v_quiz.show_correct_answers_after,
      'question_count', v_question_count,
      'total_points', v_total_points
    ),
    'has_passed', v_has_passed,
    'attempts_used', v_attempts_used,
    'remaining_attempts', v_remaining,
    'can_start', (
      v_question_count > 0
      and (v_quiz.max_attempts is null or v_attempts_used < v_quiz.max_attempts)
    ),
    'attempts', v_attempts_json,
    'active_attempt', v_active_json
  );
end;
$function$;

revoke all on function public.get_lesson_quiz_state(uuid, uuid) from public;
grant execute on function public.get_lesson_quiz_state(uuid, uuid) to authenticated;

create or replace function public.start_lesson_quiz_attempt(
  p_lesson_id uuid,
  p_quiz_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_lesson public.lessons;
  v_quiz public.quizzes;
  v_enrollment_id uuid;
  v_is_manager boolean;
  v_question_count integer;
  v_total_points numeric(8,2);
  v_completed_count integer;
  v_total_attempts integer;
  v_existing_id uuid;
begin
  if v_uid is null then
    raise exception 'Unauthenticated';
  end if;

  select * into v_lesson
  from public.lessons l
  where l.id = p_lesson_id;

  if not found or v_lesson.course_id is null then
    raise exception 'lesson_not_found';
  end if;

  if not public.is_quiz_attached_to_lesson(p_lesson_id, p_quiz_id) then
    raise exception 'quiz_not_in_lesson';
  end if;

  select * into v_quiz
  from public.quizzes q
  where q.id = p_quiz_id;

  if not found then
    raise exception 'quiz_not_found';
  end if;

  if v_quiz.course_id is not null and v_quiz.course_id <> v_lesson.course_id then
    raise exception 'quiz_bound_to_other_course';
  end if;

  select e.id into v_enrollment_id
  from public.enrollments e
  where e.course_id = v_lesson.course_id
    and e.user_id = v_uid
  limit 1;

  v_is_manager := public.can_edit_course_content(v_lesson.course_id, v_uid);

  if v_enrollment_id is null and not v_is_manager then
    raise exception 'not_enrolled';
  end if;

  if not public.is_lesson_unlocked_for_user(p_lesson_id, v_uid) then
    raise exception 'chapter_locked';
  end if;

  -- Expire any timed-out active attempt first via get_lesson_quiz_state.
  perform public.get_lesson_quiz_state(p_lesson_id, p_quiz_id);

  -- Resume an unexpired active attempt instead of consuming another attempt.
  select qa.id into v_existing_id
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.user_id = v_uid
    and qa.completed_at is null
  order by qa.created_at desc
  limit 1;

  if v_existing_id is not null then
    return public.get_lesson_quiz_state(p_lesson_id, p_quiz_id);
  end if;

  select count(*)::integer, coalesce(sum(coalesce(qn.points, 1)), 0)
    into v_question_count, v_total_points
  from public.questions qn
  where qn.quiz_id = p_quiz_id;

  if v_question_count = 0 then
    raise exception 'quiz_has_no_questions';
  end if;

  select
    count(*) filter (where qa.completed_at is not null)::integer,
    count(*)::integer
  into v_completed_count, v_total_attempts
  from public.quiz_attempts qa
  where qa.quiz_id = p_quiz_id
    and qa.user_id = v_uid;

  if v_quiz.max_attempts is not null and v_completed_count >= v_quiz.max_attempts then
    raise exception 'max_attempts_reached';
  end if;

  insert into public.quiz_attempts (
    enrollment_id,
    quiz_id,
    user_id,
    attempt_number,
    max_score_possible,
    started_at
  )
  values (
    v_enrollment_id,
    p_quiz_id,
    v_uid,
    v_total_attempts + 1,
    v_total_points,
    now()
  );

  return public.get_lesson_quiz_state(p_lesson_id, p_quiz_id);
end;
$function$;

revoke all on function public.start_lesson_quiz_attempt(uuid, uuid) from public;
grant execute on function public.start_lesson_quiz_attempt(uuid, uuid) to authenticated;

create or replace function public.submit_lesson_quiz_attempt(
  p_attempt_id uuid,
  p_lesson_id uuid,
  p_answers jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_attempt public.quiz_attempts;
  v_lesson public.lessons;
  v_quiz public.quizzes;
  v_q record;
  v_ans jsonb;
  v_selected_ids uuid[];
  v_answer_text text;
  v_structured jsonb;
  v_correct_ids uuid[];
  v_expected_blanks text[];
  v_given_blanks text[];
  v_opt record;
  v_all_match boolean;
  v_is_correct boolean;
  v_points_awarded numeric(6,2);
  v_feedback text;
  v_q_points numeric(6,2);
  v_total_score numeric(8,2) := 0;
  v_max_score numeric(8,2) := 0;
  v_awaiting_manual integer := 0;
  v_passed boolean;
  v_score_pct numeric(5,2);
  v_lesson_completed boolean := false;
  v_show_answers boolean := false;
  v_review jsonb := null;
  v_instructor_id uuid;
  v_idx integer;
begin
  if v_uid is null then
    raise exception 'Unauthenticated';
  end if;

  select * into v_attempt
  from public.quiz_attempts qa
  where qa.id = p_attempt_id;

  if not found then
    raise exception 'attempt_not_found';
  end if;

  if v_attempt.user_id <> v_uid then
    raise exception 'Permission denied.';
  end if;

  if v_attempt.completed_at is not null then
    raise exception 'attempt_already_completed';
  end if;

  select * into v_lesson
  from public.lessons l
  where l.id = p_lesson_id;

  if not found or v_lesson.course_id is null then
    raise exception 'lesson_not_found';
  end if;

  if not public.is_quiz_attached_to_lesson(p_lesson_id, v_attempt.quiz_id) then
    raise exception 'quiz_not_in_lesson';
  end if;

  select * into v_quiz
  from public.quizzes q
  where q.id = v_attempt.quiz_id;

  if not found then
    raise exception 'quiz_not_found';
  end if;

  if v_quiz.course_id is not null and v_quiz.course_id <> v_lesson.course_id then
    raise exception 'quiz_bound_to_other_course';
  end if;

  if not public.is_lesson_unlocked_for_user(p_lesson_id, v_uid) then
    raise exception 'chapter_locked';
  end if;

  -- Grade every question belonging to the quiz atomically.
  for v_q in
    select qn.*
    from public.questions qn
    where qn.quiz_id = v_quiz.id
    order by qn.order_index asc, qn.id asc
  loop
    v_q_points := coalesce(v_q.points, 1);
    v_max_score := v_max_score + v_q_points;
    v_is_correct := false;
    v_points_awarded := 0;
    v_feedback := null;
    v_selected_ids := null;
    v_answer_text := null;
    v_structured := null;

    select elem into v_ans
    from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) elem
    where elem ->> 'question_id' = v_q.id::text
    limit 1;

    if v_ans is not null then
      if jsonb_typeof(v_ans -> 'selected_option_ids') = 'array' then
        select coalesce(array_agg(distinct (val)::uuid), array[]::uuid[])
          into v_selected_ids
        from jsonb_array_elements_text(v_ans -> 'selected_option_ids') val
        where val ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      end if;
      v_answer_text := nullif(btrim(coalesce(v_ans ->> 'answer_text', '')), '');
      if v_ans ? 'structured_answer' and jsonb_typeof(v_ans -> 'structured_answer') <> 'null' then
        v_structured := v_ans -> 'structured_answer';
      end if;
    end if;

    case v_q.question_type
      when 'multiple_choice_single_correct', 'true_false', 'yes_no' then
        if coalesce(array_length(v_selected_ids, 1), 0) = 1 then
          select coalesce(qo.is_correct, false), qo.feedback
            into v_is_correct, v_feedback
          from public.question_options qo
          where qo.question_id = v_q.id
            and qo.id = v_selected_ids[1];
          v_is_correct := coalesce(v_is_correct, false);
        else
          v_is_correct := false;
        end if;

      when 'multiple_choice_multiple_correct', 'image_based_question' then
        select coalesce(array_agg(qo.id order by qo.id), array[]::uuid[])
          into v_correct_ids
        from public.question_options qo
        where qo.question_id = v_q.id
          and qo.is_correct = true;

        if coalesce(array_length(v_correct_ids, 1), 0) = 0 then
          -- Image question configured without options falls back to manual grading.
          v_is_correct := null;
        elsif coalesce(array_length(v_selected_ids, 1), 0) = array_length(v_correct_ids, 1)
          and (
            select array_agg(s_id order by s_id)
            from unnest(v_selected_ids) s_id
            where exists (
              select 1 from public.question_options qo
              where qo.id = s_id and qo.question_id = v_q.id
            )
          ) = v_correct_ids then
          v_is_correct := true;
        else
          v_is_correct := false;
        end if;

        if coalesce(array_length(v_selected_ids, 1), 0) = 1 then
          select qo.feedback into v_feedback
          from public.question_options qo
          where qo.question_id = v_q.id and qo.id = v_selected_ids[1];
        end if;

      when 'fill_in_the_blanks' then
        select coalesce(
          array_agg(lower(btrim(coalesce(qo.option_text, ''))) order by coalesce(qo.order_index, 0) asc, qo.id asc),
          array[]::text[]
        )
        into v_expected_blanks
        from public.question_options qo
        where qo.question_id = v_q.id;

        if v_structured is not null and jsonb_typeof(v_structured -> 'blanks') = 'array' then
          select coalesce(
            array_agg(lower(btrim(coalesce(b_val, ''))) order by b_ord),
            array[]::text[]
          )
          into v_given_blanks
          from jsonb_array_elements_text(v_structured -> 'blanks') with ordinality as t(b_val, b_ord);
        elsif v_answer_text is not null then
          v_given_blanks := array[lower(btrim(v_answer_text))];
        else
          v_given_blanks := array[]::text[];
        end if;

        if array_length(v_expected_blanks, 1) is not null
           and array_length(v_given_blanks, 1) = array_length(v_expected_blanks, 1) then
          v_all_match := true;
          for v_idx in 1..array_length(v_expected_blanks, 1) loop
            if v_given_blanks[v_idx] <> v_expected_blanks[v_idx] or v_given_blanks[v_idx] = '' then
              v_all_match := false;
              exit;
            end if;
          end loop;
          v_is_correct := v_all_match;
        else
          v_is_correct := false;
        end if;

      when 'matching' then
        if v_structured is not null and jsonb_typeof(v_structured -> 'pairs') = 'object' then
          v_all_match := true;
          v_idx := 0;
          for v_opt in
            select qo.id, qo.match_target_text
            from public.question_options qo
            where qo.question_id = v_q.id
          loop
            v_idx := v_idx + 1;
            if lower(btrim(coalesce((v_structured -> 'pairs') ->> v_opt.id::text, '')))
               <> lower(btrim(coalesce(v_opt.match_target_text, ''))) then
              v_all_match := false;
              exit;
            end if;
          end loop;
          v_is_correct := (v_idx > 0 and v_all_match);
        else
          v_is_correct := false;
        end if;

      when 'ordering' then
        select coalesce(
          array_agg(qo.id order by coalesce(qo.order_index, 0) asc, qo.id asc),
          array[]::uuid[]
        )
        into v_correct_ids
        from public.question_options qo
        where qo.question_id = v_q.id;

        if v_structured is not null and jsonb_typeof(v_structured -> 'ordered_option_ids') = 'array' then
          select coalesce(
            array_agg((o_val)::uuid order by o_ord),
            array[]::uuid[]
          )
          into v_selected_ids
          from jsonb_array_elements_text(v_structured -> 'ordered_option_ids') with ordinality as t(o_val, o_ord)
          where o_val ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        end if;

        v_is_correct := (v_selected_ids is not null and v_selected_ids = v_correct_ids);

      when 'short_answer_text', 'long_answer_text' then
        if v_answer_text is null then
          v_is_correct := false;
        else
          v_is_correct := null;
        end if;

      else
        v_is_correct := null;
    end case;

    if v_is_correct is null then
      v_awaiting_manual := v_awaiting_manual + 1;
      v_points_awarded := 0;
    elsif v_is_correct then
      v_points_awarded := v_q_points;
      v_total_score := v_total_score + v_points_awarded;
    else
      v_points_awarded := 0;
    end if;

    insert into public.answers (
      quiz_attempt_id,
      question_id,
      selected_option_ids,
      answer_text,
      structured_answer,
      is_correct,
      points_awarded,
      feedback,
      submitted_at
    )
    values (
      p_attempt_id,
      v_q.id,
      v_selected_ids,
      v_answer_text,
      v_structured,
      v_is_correct,
      v_points_awarded,
      v_feedback,
      now()
    )
    on conflict (quiz_attempt_id, question_id) do update
    set selected_option_ids = excluded.selected_option_ids,
        answer_text = excluded.answer_text,
        structured_answer = excluded.structured_answer,
        is_correct = excluded.is_correct,
        points_awarded = excluded.points_awarded,
        feedback = excluded.feedback,
        submitted_at = now(),
        updated_at = now();
  end loop;

  if v_max_score > 0 then
    v_score_pct := round((v_total_score * 100.0) / v_max_score, 2);
  else
    v_score_pct := 100;
  end if;

  if v_awaiting_manual > 0 then
    v_passed := null;
  elsif v_quiz.passing_score_percentage is null or v_max_score <= 0 then
    v_passed := true;
  else
    v_passed := ((v_total_score * 100.0) / v_max_score) >= v_quiz.passing_score_percentage;
  end if;

  update public.quiz_attempts
  set score = v_total_score,
      max_score_possible = v_max_score,
      passed = v_passed,
      completed_at = now(),
      updated_at = now()
  where id = p_attempt_id
  returning * into v_attempt;

  -- Complete the lesson automatically once all quizzes in this lesson are passed.
  if v_passed = true
     and public.is_enrolled(v_lesson.course_id, v_uid)
     and public.has_user_passed_lesson_quizzes(p_lesson_id, v_uid) then
    perform public.complete_lesson_for_user(p_lesson_id, v_uid);
    v_lesson_completed := true;
  end if;

  -- Notifications (mirrors complete_and_grade_quiz_attempt).
  if v_awaiting_manual > 0 then
    select c.instructor_id into v_instructor_id
    from public.courses c
    where c.id = v_lesson.course_id;

    if v_instructor_id is not null then
      perform public.create_app_notification(
        p_user_id := v_instructor_id,
        p_type := 'new_assignment_submission',
        p_title := 'Quiz Needs Grading: ' || v_quiz.title,
        p_message := coalesce((select pf.full_name from public.profiles pf where pf.id = v_uid), 'A student')
          || ' submitted "' || v_quiz.title || '" which requires manual grading.',
        p_related_entity_type := 'quiz_attempt',
        p_related_entity_id := p_attempt_id,
        p_actor_id := v_uid
      );
    end if;
  else
    perform public.create_app_notification(
      p_user_id := v_uid,
      p_type := 'quiz_graded',
      p_title := 'Quiz Graded: ' || v_quiz.title,
      p_message := 'Score: ' || v_total_score || '/' || v_max_score || ' (' || v_score_pct || '%).',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_attempt_id,
      p_actor_id := null
    );
  end if;

  -- Include per-question review only when the quiz allows immediate answers.
  v_show_answers := (v_quiz.show_correct_answers_after = 'attempt'::public.show_correct_answers);

  if v_show_answers then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'question_id', qn.id,
          'question_text', qn.question_text,
          'question_type', qn.question_type,
          'points', coalesce(qn.points, 1),
          'points_awarded', coalesce(a.points_awarded, 0),
          'is_correct', a.is_correct,
          'explanation', qn.explanation,
          'feedback', a.feedback,
          'selected_option_ids', coalesce(to_jsonb(a.selected_option_ids), '[]'::jsonb),
          'answer_text', a.answer_text,
          'structured_answer', a.structured_answer,
          'options', (
            select coalesce(
              jsonb_agg(
                jsonb_build_object(
                  'id', qo.id,
                  'option_text', qo.option_text,
                  'is_correct', coalesce(qo.is_correct, false),
                  'feedback', qo.feedback,
                  'match_target_text', qo.match_target_text,
                  'order_index', coalesce(qo.order_index, 0)
                )
                order by coalesce(qo.order_index, 0) asc, qo.id asc
              ),
              '[]'::jsonb
            )
            from public.question_options qo
            where qo.question_id = qn.id
          )
        )
        order by qn.order_index asc, qn.id asc
      ),
      '[]'::jsonb
    )
    into v_review
    from public.questions qn
    left join public.answers a
      on a.question_id = qn.id
     and a.quiz_attempt_id = p_attempt_id
    where qn.quiz_id = v_quiz.id;
  end if;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'attempt_number', v_attempt.attempt_number,
      'score', v_total_score,
      'max_score_possible', v_max_score,
      'score_percentage', v_score_pct,
      'passing_score_percentage', v_quiz.passing_score_percentage,
      'passed', v_passed,
      'awaiting_manual_grade', (v_awaiting_manual > 0),
      'completed_at', v_attempt.completed_at
    ),
    'lesson_completed', v_lesson_completed,
    'show_answers', v_show_answers,
    'review', v_review,
    'state', public.get_lesson_quiz_state(p_lesson_id, v_quiz.id)
  );
end;
$function$;

revoke all on function public.submit_lesson_quiz_attempt(uuid, uuid, jsonb) from public;
grant execute on function public.submit_lesson_quiz_attempt(uuid, uuid, jsonb) to authenticated;

-- Complete quiz-block lessons automatically when an instructor finishes
-- manual grading and the attempt transitions from pending (null) to passed.
create or replace function public.complete_quiz_block_lessons_on_manual_pass()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_course_id uuid;
  v_lesson_id uuid;
begin
  if new.passed = true
     and old.passed is null
     and old.completed_at is not null
     and new.enrollment_id is not null
     and new.user_id is not null then
    select e.course_id into v_course_id
    from public.enrollments e
    where e.id = new.enrollment_id;

    if v_course_id is not null then
      for v_lesson_id in
        select distinct b.lesson_id
        from public.lesson_content_blocks b
        where b.course_id = v_course_id
          and b.block_type = 'quiz'::public.lesson_content_type
          and b.quiz_id = new.quiz_id
          and b.lesson_id is not null
      loop
        if public.has_user_passed_lesson_quizzes(v_lesson_id, new.user_id)
           and public.is_lesson_unlocked_for_user(v_lesson_id, new.user_id) then
          perform public.complete_lesson_for_user(v_lesson_id, new.user_id);
        end if;
      end loop;
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_complete_quiz_block_lessons_on_manual_pass on public.quiz_attempts;
create trigger trg_complete_quiz_block_lessons_on_manual_pass
  after update of passed on public.quiz_attempts
  for each row
  execute function public.complete_quiz_block_lessons_on_manual_pass();

-- 7. Enforce quiz & chapter gating in complete_lesson_for_user ---------------

create or replace function public.complete_lesson_for_user(
  p_lesson_id uuid,
  p_user_id uuid default auth.uid()
)
returns public.lesson_progress
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  enrollment_record public.enrollments;
  lesson_record public.lessons;
  course_record public.courses;
  user_profile public.profiles;
  updated_lesson_progress public.lesson_progress;
  total_mandatory_lessons_in_course int;
  completed_mandatory_lessons_by_user int;
  total_lessons_in_course int;
  completed_lessons_by_user int;
  new_course_progress_percentage smallint;
  new_certificate_id uuid;
  v_is_staff_override boolean := false;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into lesson_record from public.lessons where id = p_lesson_id;
  if lesson_record is null then
    raise exception 'Lesson not found: ID %', p_lesson_id;
  end if;

  select * into course_record from public.courses where id = lesson_record.course_id;
  select * into user_profile from public.profiles where id = p_user_id;

  -- SECURITY DEFINER guard: only the learner themselves, a course manager,
  -- an admin, or the service role may record completion for p_user_id.
  if nullif(current_setting('request.jwt.claims', true), '') is not null then
    if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
      v_is_staff_override := true;
    elsif auth.uid() is null then
      raise exception 'Not authorized to complete this lesson for user %.', p_user_id;
    elsif public.can_edit_course_content(course_record.id, auth.uid())
          or public.is_admin(auth.uid()) then
      v_is_staff_override := (auth.uid() <> p_user_id);
    elsif auth.uid() <> p_user_id then
      raise exception 'Not authorized to complete this lesson for user %.', p_user_id;
    end if;
  end if;

  -- Learners cannot bypass a previous chapter's mandatory quiz or this lesson's quiz.
  if not v_is_staff_override then
    if not public.is_lesson_unlocked_for_user(p_lesson_id, p_user_id) then
      raise exception 'Previous chapter quiz must be passed before completing this lesson.';
    end if;

    if public.lesson_has_quiz(p_lesson_id)
       and not public.has_user_passed_lesson_quizzes(p_lesson_id, p_user_id) then
      raise exception 'Quiz must be passed before completing this lesson.';
    end if;
  end if;

  select * into enrollment_record
  from public.enrollments
  where user_id = p_user_id and course_id = course_record.id;

  if enrollment_record is null then
    raise exception 'User % is not enrolled in the course "%" containing this lesson.', user_profile.full_name, course_record.title;
  end if;

  if enrollment_record.completed_at is not null then
    raise warning 'Course "%" is already marked as completed by user %.', course_record.title, user_profile.full_name;
  end if;

  insert into public.lesson_progress (enrollment_id, lesson_id, user_id, is_completed, completed_at, last_accessed_at)
  values (enrollment_record.id, p_lesson_id, p_user_id, true, now(), now())
  on conflict (enrollment_id, lesson_id) do update
  set
    is_completed = true,
    completed_at = coalesce(public.lesson_progress.completed_at, now()),
    last_accessed_at = now()
  returning * into updated_lesson_progress;

  select count(*) into total_mandatory_lessons_in_course
  from public.lessons l_count
  where l_count.course_id = course_record.id and l_count.is_mandatory = true;

  if total_mandatory_lessons_in_course > 0 then
    select count(distinct lp.lesson_id) into completed_mandatory_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id
      and l_check.course_id = course_record.id
      and l_check.is_mandatory = true
      and lp.is_completed = true
      and (
        not public.lesson_has_quiz(l_check.id)
        or public.has_user_passed_lesson_quizzes(l_check.id, p_user_id)
      );

    new_course_progress_percentage = least(100, (completed_mandatory_lessons_by_user * 100 / total_mandatory_lessons_in_course))::smallint;
  else
    select count(*) into total_lessons_in_course
    from public.lessons l_count
    where l_count.course_id = course_record.id;

    select count(distinct lp.lesson_id) into completed_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id
      and l_check.course_id = course_record.id
      and lp.is_completed = true;

    if total_lessons_in_course > 0 and completed_lessons_by_user = total_lessons_in_course then
      new_course_progress_percentage = 100;
    elsif total_lessons_in_course = 0 then
      new_course_progress_percentage = 100;
    else
      new_course_progress_percentage = enrollment_record.progress_percentage;
    end if;
  end if;

  update public.enrollments
  set
    progress_percentage = new_course_progress_percentage,
    last_accessed_lesson_id = p_lesson_id,
    updated_at = now()
  where id = enrollment_record.id;

  if new_course_progress_percentage = 100 and enrollment_record.completed_at is null then
    update public.enrollments
    set completed_at = now()
    where id = enrollment_record.id;

    if course_record.certificate_enabled then
      insert into public.certificates (user_id, course_id, course_title, user_full_name, verification_code)
      values (
        p_user_id,
        course_record.id,
        course_record.title,
        user_profile.full_name,
        upper(substr(md5(random()::text || clock_timestamp()::text), 1, 16))
      ) returning id into new_certificate_id;

      update public.enrollments set certificate_id = new_certificate_id where id = enrollment_record.id;

      perform public.create_app_notification(
        p_user_id := p_user_id,
        p_type := 'course_completion',
        p_title := 'Congratulations! Course Completed: ' || course_record.title,
        p_message := 'You have successfully completed "' || course_record.title || '". Your certificate is now available.',
        p_related_entity_type := 'certificate',
        p_related_entity_id := new_certificate_id,
        p_actor_id := null
      );
    end if;

    perform public.create_app_notification(
      p_user_id := course_record.instructor_id,
      p_type := 'course_completion',
      p_title := 'Student Completed Course: ' || course_record.title,
      p_message := coalesce(user_profile.full_name, 'A student') || ' has completed your course "' || course_record.title || '".',
      p_related_entity_type := 'enrollment',
      p_related_entity_id := enrollment_record.id,
      p_actor_id := p_user_id
    );
  end if;

  return updated_lesson_progress;
end;
$function$;

-- 8. Expose quiz-gate metadata on lessons in get_course_details --------------

create or replace function public.get_course_details(
  p_course_slug text default null::text,
  p_course_id uuid default null::uuid
)
returns table (
  id uuid,
  title text,
  slug text,
  subtitle text,
  description text,
  seo_title text,
  seo_description text,
  instructor user_info,
  level course_level,
  language language_enum,
  cover_image_url text,
  promo_video_url text,
  welcome_message text,
  learning_objectives text[],
  prerequisites text[],
  is_published boolean,
  published_at timestamp with time zone,
  is_free boolean,
  price numeric,
  currency character,
  price_credits integer,
  enrollment_limit integer,
  estimated_duration_hours integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  average_rating numeric,
  total_reviews bigint,
  total_enrollments bigint,
  total_lessons integer,
  modules jsonb,
  subject item_type,
  book item_type,
  grade item_type,
  enrollment jsonb,
  related_decks_ids uuid[],
  related_quizzes_ids uuid[],
  related_libraries_ids uuid[],
  school_id uuid
)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_catalog'
as $function$
begin
  if p_course_slug is null and p_course_id is null then
    raise exception 'Either course slug or course ID must be provided.';
  end if;

  return query
  select
    c.id,
    c.title,
    c.slug,
    c.subtitle,
    c.description,
    c.seo_title,
    c.seo_description,
    row(
      c.instructor_id,
      p.slug,
      p.email,
      p.full_name,
      p.avatar_url
    )::user_info,
    c.level,
    c.language,
    c.cover_image_url,
    c.promo_video_url,
    c.welcome_message,
    c.learning_objectives,
    c.prerequisites,
    c.is_published,
    c.published_at,
    c.is_free,
    c.price,
    c.currency,
    c.price_credits,
    c.enrollment_limit,
    c.estimated_duration_hours,
    c.created_at,
    c.updated_at,
    c.average_rating,
    c.total_reviews::bigint as total_reviews,
    (select count(e.id) from public.enrollments e where e.course_id = c.id) as total_enrollments,
    (select count(l.id)::integer from public.lessons l where l.course_id = c.id) as total_lessons,
    (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'order_index', m.order_index,
          'lessons', (
            select coalesce(jsonb_agg(
              jsonb_build_object(
                'id', l.id,
                'title', l.title,
                'content_type', l.content_type,
                'order_index', l.order_index,
                'estimated_duration_minutes', l.estimated_duration_minutes,
                'is_previewable', l.is_previewable,
                'is_mandatory', coalesce(l.is_mandatory, true),
                'has_quiz', public.lesson_has_quiz(l.id),
                'quiz_passed',
                  case
                    when (select auth.uid()) is not null and public.lesson_has_quiz(l.id)
                      then public.has_user_passed_lesson_quizzes(l.id, (select auth.uid()))
                    else null
                  end,
                'lesson_progress',
                  case
                    when (select auth.uid()) is not null then (
                      select jsonb_build_object(
                        'id', lp.id,
                        'is_completed', lp.is_completed,
                        'completed_at', lp.completed_at,
                        'last_accessed_at', lp.last_accessed_at,
                        'video_progress_seconds', lp.video_progress_seconds
                      )
                      from public.lesson_progress lp
                      where lp.user_id = (select auth.uid())
                        and lp.lesson_id = l.id
                      limit 1
                    )
                    else null
                  end
              ) order by l.order_index asc
            ), '[]'::jsonb)
            from public.lessons l
            where l.module_id = m.id
          )
        ) order by m.order_index asc
      ), '[]'::jsonb)
      from public.modules m
      where m.course_id = c.id
    ) as modules,
    row(
      s.id,
      s.name
    )::item_type as subject,
    row(
      b.id,
      b.name
    )::item_type as book,
    row(
      g.id,
      g.name
    )::item_type as grade,
    case
      when (select auth.uid()) is not null then (
        select jsonb_build_object(
          'progress_percentage', e.progress_percentage,
          'last_accessed_lesson_id', e.last_accessed_lesson_id,
          'completed_at', e.completed_at,
          'enrolled_at', e.enrolled_at
        )
        from public.enrollments e
        where e.user_id = (select auth.uid())
          and e.course_id = c.id
        limit 1
      )
      else null
    end as enrollment,
    c.related_decks_ids,
    c.related_quizzes_ids,
    c.related_libraries_ids,
    c.school_id
  from public.courses c
  left join public.profiles p on c.instructor_id = p.id
  left join public.subjects s on s.id = c.subject_id
  left join public.books b on b.id = c.book_id
  left join public.grades g on g.id = c.grade_id
  where (p_course_slug is not null and c.slug = p_course_slug)
     or (p_course_id is not null and c.id = p_course_id);
end;
$function$;
