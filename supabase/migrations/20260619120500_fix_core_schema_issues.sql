-- =============================================================================
-- Fix migration for issues identified in SCHEMA_REVIEW.md against
-- 20260619114438_core_schema.sql
--
-- Covers: security/RLS gaps, broken PL/pgSQL functions (phantom tables/columns,
-- bigint/uuid mismatches, missing SECURITY DEFINER), missing unique constraints,
-- bad column defaults, duplicate/wrong FKs, redundant constraints, missing
-- updated_at triggers, overly-broad TRUNCATE grants, and the predictable
-- entrance_code identity column.
-- =============================================================================

set check_function_bodies = off;

-- -----------------------------------------------------------------------------
-- 0. Credential rotation (NOT done in SQL on purpose)
-- -----------------------------------------------------------------------------
-- The original migration committed a plaintext password for powersync_role:
--   CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'ZqqiUkGpSecuQOP0DYHotgi0HR4MjfN2';
-- That password must be treated as compromised since it is in git history.
-- Do NOT put a replacement password in any migration file (that just repeats
-- the same mistake). Instead, rotate it out-of-band, e.g. via the Supabase
-- SQL editor or CLI using a value from a secrets manager:
--   ALTER ROLE powersync_role WITH PASSWORD '<new-strong-password-from-secret-store>';
-- Then update the PowerSync connection config with the new password, and
-- consider scrubbing the old password from git history (BFG / filter-repo).

-- -----------------------------------------------------------------------------
-- 1. Unique constraints required for ON CONFLICT targets
-- -----------------------------------------------------------------------------

alter table public.answers
  add constraint answers_quiz_attempt_id_question_id_key
  unique (quiz_attempt_id, question_id);

alter table public.lesson_progress
  add constraint lesson_progress_enrollment_id_lesson_id_key
  unique (enrollment_id, lesson_id);

-- -----------------------------------------------------------------------------
-- 2. profiles_province_id_fkey pointed at the wrong table
-- -----------------------------------------------------------------------------

alter table public.profiles
  drop constraint if exists profiles_province_id_fkey;

alter table public.profiles
  add constraint profiles_province_id_fkey
  foreign key (province_id) references public.provinces(id) on delete set null;

-- -----------------------------------------------------------------------------
-- 3. Duplicate FK on books.grade_id (keep the one with ON DELETE SET NULL)
-- -----------------------------------------------------------------------------

alter table public.books
  drop constraint if exists books_grade_id_fkey;

-- books_grade_id_fkey1 (ON DELETE SET NULL) remains as the single FK.

-- -----------------------------------------------------------------------------
-- 4. Drop redundant *_pk_key UNIQUE constraints that duplicate the *_pkey PK
-- -----------------------------------------------------------------------------
-- Some of these redundant unique constraints are the one that other tables'
-- foreign keys actually got bound to at creation time (e.g. courses_book_id_fkey,
-- decks_book_id_fkey, etc. depend on books_pk_key, not books_pkey). A plain
-- DROP CONSTRAINT fails with "other objects depend on it" in that case. This
-- block finds any such dependent FK constraints first, drops them, drops the
-- redundant unique constraint, then recreates the FK constraints verbatim --
-- at that point they bind to the remaining unique constraint (the real PK).

do $$
declare
  redundant_constraints text[] := array[
    'books_pk_key','categories_pk_key','courses_pk_key','decks_pk_key','departments_pk_key',
    'discussion_posts_pk_key','enrollments_pk_key','faculties_pk_key','flashcards_pk_key',
    'forms_pk_key','grades_pk_key','leitners_pk_key','lesson_content_blocks_pk_key',
    'lessons_pk_key','libraries_pk_key','modules_pk_key','notes_pk_key','provinces_pk_key',
    'question_options_pk_key','questions_pk_key','quiz_attempts_pk_key','quizzes_pk_key',
    'schools_pk_key','subjects_pk_key','universities_pk_key','universities_faculties_pk_key'
  ];
  cname text;
  con_oid oid;
  tbl_oid oid;
  idx_oid oid;
  fk record;
  fk_names text[];
  fk_tables regclass[];
  fk_defs text[];
  i int;
begin
  foreach cname in array redundant_constraints loop
    select c.oid, c.conrelid, c.conindid
      into con_oid, tbl_oid, idx_oid
    from pg_constraint c
    where c.conname = cname and c.connamespace = 'public'::regnamespace;

    if con_oid is null then
      continue; -- already dropped / never existed, nothing to do
    end if;

    fk_names := array[]::text[];
    fk_tables := array[]::regclass[];
    fk_defs := array[]::text[];

    for fk in
      select fc.conname, fc.conrelid::regclass as reltable, pg_get_constraintdef(fc.oid) as def
      from pg_constraint fc
      where fc.contype = 'f' and fc.confrelid = tbl_oid and fc.conindid = idx_oid
    loop
      fk_names := array_append(fk_names, fk.conname);
      fk_tables := array_append(fk_tables, fk.reltable);
      fk_defs := array_append(fk_defs, fk.def);
      execute format('alter table %s drop constraint %I', fk.reltable, fk.conname);
    end loop;

    execute format('alter table %s drop constraint %I', tbl_oid::regclass, cname);

    for i in 1 .. coalesce(array_length(fk_names, 1), 0) loop
      execute format('alter table %s add constraint %I %s', fk_tables[i], fk_names[i], fk_defs[i]);
    end loop;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. FK-like columns wrongly defaulting to gen_random_uuid() instead of NULL
-- -----------------------------------------------------------------------------

alter table public.deck_cards alter column flashcard_id drop default;
alter table public.decks alter column user_id set default auth.uid();
alter table public.leitners alter column user_id set default auth.uid();
alter table public.schools alter column manager drop default;

-- -----------------------------------------------------------------------------
-- 6. quizzes.entrance_code: replace the sequential identity column with a
--    random, non-enumerable text code
-- -----------------------------------------------------------------------------
-- NOTE: this changes the column type from integer to text. Any client code
-- (mobile app / RPC callers) that parses entrance_code as a number must be
-- updated to treat it as an opaque string.

alter table public.quizzes drop constraint if exists quizzes_entrance_code_key;
alter table public.quizzes alter column entrance_code drop identity if exists;
alter table public.quizzes alter column entrance_code drop not null;
alter table public.quizzes alter column entrance_code type text using entrance_code::text;
alter table public.quizzes alter column entrance_code set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
update public.quizzes set entrance_code = upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 8)) where entrance_code is null;
alter table public.quizzes alter column entrance_code set not null;
alter table public.quizzes add constraint quizzes_entrance_code_key unique (entrance_code);

-- -----------------------------------------------------------------------------
-- 7. Revoke TRUNCATE from client-facing roles (it bypasses RLS entirely)
-- -----------------------------------------------------------------------------

revoke truncate on all tables in schema public from anon;
revoke truncate on all tables in schema public from authenticated;

-- -----------------------------------------------------------------------------
-- 8. Missing updated_at triggers
-- -----------------------------------------------------------------------------
-- Drop the misleadingly-named duplicate trigger that already covers "modules"
-- under the old "sections" name, then add triggers for every table that has
-- an updated_at column but no maintaining trigger.

drop trigger if exists set_sections_updated_at on public.modules;

create trigger set_answer_sheets_updated_at before update on public.answer_sheets for each row execute function public.handle_updated_at();
create trigger set_answers_updated_at before update on public.answers for each row execute function public.handle_updated_at();
create trigger set_bookmarks_updated_at before update on public.bookmarks for each row execute function public.handle_updated_at();
create trigger set_books_updated_at before update on public.books for each row execute function public.handle_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.handle_updated_at();
create trigger set_certificates_updated_at before update on public.certificates for each row execute function public.handle_updated_at();
create trigger set_code_updated_at before update on public.code for each row execute function public.handle_updated_at();
create trigger set_deck_cards_updated_at before update on public.deck_cards for each row execute function public.handle_updated_at();
create trigger set_decks_updated_at before update on public.decks for each row execute function public.handle_updated_at();
create trigger set_departments_updated_at before update on public.departments for each row execute function public.handle_updated_at();
create trigger set_faculties_updated_at before update on public.faculties for each row execute function public.handle_updated_at();
create trigger set_flashcards_updated_at before update on public.flashcards for each row execute function public.handle_updated_at();
create trigger set_forms_updated_at before update on public.forms for each row execute function public.handle_updated_at();
create trigger set_grades_updated_at before update on public.grades for each row execute function public.handle_updated_at();
create trigger set_leitners_updated_at before update on public.leitners for each row execute function public.handle_updated_at();
create trigger set_lesson_progress_updated_at before update on public.lesson_progress for each row execute function public.handle_updated_at();
create trigger set_libraries_updated_at before update on public.libraries for each row execute function public.handle_updated_at();
create trigger set_notes_updated_at before update on public.notes for each row execute function public.handle_updated_at();
create trigger set_notifications_updated_at before update on public.notifications for each row execute function public.handle_updated_at();
create trigger set_provinces_updated_at before update on public.provinces for each row execute function public.handle_updated_at();
create trigger set_question_options_updated_at before update on public.question_options for each row execute function public.handle_updated_at();
create trigger set_schools_updated_at before update on public.schools for each row execute function public.handle_updated_at();
create trigger set_subjects_updated_at before update on public.subjects for each row execute function public.handle_updated_at();
create trigger set_universities_updated_at before update on public.universities for each row execute function public.handle_updated_at();
create trigger set_universities_faculties_updated_at before update on public.universities_faculties for each row execute function public.handle_updated_at();
create trigger set_tags_updated_at before update on public.tags for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 9. custom_access_token_hook / get_user_role: query profiles.id, not the
--    nonexistent profiles.user_id
-- -----------------------------------------------------------------------------
-- NOTE: the RLS policies for questions/question_options/quizzes/discussion_*/
-- answers (originally section 9) have been moved to the end of this file
-- (section 23), after all the function rewrites below. Those policies call
-- is_enrolled(uuid, uuid)/is_course_instructor(...), which only exist with
-- that signature once section 10 drops the old bigint overloads and sections
-- 11-21 recreate them as uuid -- creating the policies first (as in the
-- original ordering) fails with "function ... does not exist" (SQLSTATE
-- 42883) because statements run strictly top-to-bottom in one transaction.
-- Section 23 also redesigns the questions/question_options/quizzes policies
-- themselves; see the comment block there for why.

create or replace function public.custom_access_token_hook(event jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path = ''
as $function$
declare
  claims jsonb;
  v_role public.user_role;
begin
  select role
  into v_role
  from public.profiles
  where id = (event->>'user_id')::uuid;

  v_role := coalesce(v_role, 'student'::public.user_role);

  claims := event->'claims';

  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;

  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(v_role));

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$function$;

create or replace function public.get_user_role(user_id uuid default auth.uid())
 returns public.user_role
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  jwt_role text;
  db_role public.user_role;
begin
  if user_id is null then
    return null;
  end if;

  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';

  if jwt_role is not null then
    begin
      return jwt_role::public.user_role;
    exception
      when invalid_text_representation then
        null;
    end;
  end if;

  select role
  into db_role
  from public.profiles
  where id = get_user_role.user_id;

  return db_role;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 10. Drop functions whose signatures change type (bigint -> uuid), since
--     CREATE OR REPLACE cannot change argument types or return-column lists
-- -----------------------------------------------------------------------------

drop function if exists public.complete_and_grade_quiz_attempt(bigint, uuid);
drop function if exists public.complete_lesson_for_user(bigint, uuid);
drop function if exists public.get_course_average_rating(bigint);
drop function if exists public.get_course_details(text, bigint);
drop function if exists public.get_course_id_from_lesson(bigint);
drop function if exists public.get_course_id_from_section(bigint);
drop function if exists public.instructor_grade_answer_and_update_quiz(bigint, boolean, numeric, text, uuid);
drop function if exists public.is_enrolled(uuid, bigint);
drop function if exists public.set_course_published_status(bigint, boolean);
drop function if exists public.start_quiz_attempt(bigint, uuid);
drop function if exists public.submit_quiz_answer(bigint, bigint, bigint[], text, jsonb, uuid);

-- -----------------------------------------------------------------------------
-- 11. get_course_id_from_lesson / get_course_id_from_section: uuid, and
--     pointed at the real "modules" table instead of the phantom "sections"
-- -----------------------------------------------------------------------------

create or replace function public.get_course_id_from_lesson(check_lesson_id uuid)
 returns uuid
 language plpgsql
 stable
 security definer
as $function$
declare
  resolved_course_id uuid;
begin
  select l.course_id into resolved_course_id
  from public.lessons l
  where l.id = check_lesson_id;

  return resolved_course_id;
end;
$function$;

create or replace function public.get_course_id_from_section(check_section_id uuid)
 returns uuid
 language plpgsql
 stable
 security definer
as $function$
declare
  resolved_course_id uuid;
begin
  -- "section" here refers to public.modules, the real grouping entity above
  -- lessons; public.sections never existed in this schema.
  select m.course_id into resolved_course_id
  from public.modules m
  where m.id = check_section_id;

  return resolved_course_id;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 12. get_course_average_rating: uuid
-- -----------------------------------------------------------------------------

create or replace function public.get_course_average_rating(p_course_id uuid)
 returns numeric
 language plpgsql
 stable
as $function$
declare
  avg_rating numeric(2,1);
begin
  select avg(rating)::numeric(2,1)
  into avg_rating
  from public.reviews
  where course_id = p_course_id;

  return coalesce(avg_rating, 0.0);
end;
$function$;

-- -----------------------------------------------------------------------------
-- 13. is_enrolled: uuid
-- -----------------------------------------------------------------------------

create or replace function public.is_enrolled(check_user_id uuid, check_course_id uuid)
 returns boolean
 language plpgsql
 stable
 security definer
as $function$
begin
  return exists (
    select 1 from public.enrollments
    where course_id = check_course_id and user_id = check_user_id and completed_at is null -- Optional: only active enrollments
  );
end;
$function$;

-- -----------------------------------------------------------------------------
-- 14. set_course_published_status: uuid
-- -----------------------------------------------------------------------------

create or replace function public.set_course_published_status(p_course_id uuid, p_is_published boolean)
 returns public.courses
 language plpgsql
 security definer
as $function$
declare
  updated_course public.courses;
  current_user_id uuid := auth.uid();
  current_user_role public.user_role;
begin
  select public.get_current_user_role() into current_user_role;

  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'Course not found for ID: %', p_course_id;
  end if;

  if not (public.is_course_instructor(current_user_id, p_course_id) or current_user_role = 'admin') then
    raise exception 'Permission denied: Only the course instructor or an admin can change publication status.';
  end if;

  update public.courses
  set
    is_published = p_is_published,
    published_at = case
                     when p_is_published = true and published_at is null then now()
                     when p_is_published = false then null
                     else published_at
                   end,
    updated_at = now()
  where id = p_course_id
  returning * into updated_course;

  return updated_course;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 15. get_course_details: uuid course id, drop nonexistent category_id /
--     course_categories, build the lesson tree from modules instead of the
--     phantom "sections" table
-- -----------------------------------------------------------------------------

create or replace function public.get_course_details(p_course_slug text default null::text, p_course_id uuid default null::uuid)
 returns table(
   id uuid,
   title text,
   slug text,
   subtitle text,
   description text,
   instructor_id uuid,
   instructor_full_name text,
   instructor_avatar_url text,
   level public.course_level,
   language public.language_enum,
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
   enrollment_limit integer,
   estimated_duration_hours integer,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   average_rating numeric,
   total_reviews bigint,
   total_enrollments bigint,
   total_lessons integer,
   modules jsonb
 )
 language plpgsql
 stable
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
    c.instructor_id,
    p.full_name as instructor_full_name,
    p.avatar_url as instructor_avatar_url,
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
    c.enrollment_limit,
    c.estimated_duration_hours,
    c.created_at,
    c.updated_at,
    (select avg(r.rating)::numeric(2,1) from public.reviews r where r.course_id = c.id) as average_rating,
    (select count(r.id) from public.reviews r where r.course_id = c.id) as total_reviews,
    (select count(e.id) from public.enrollments e where e.course_id = c.id) as total_enrollments,
    (select count(l.id)::integer from public.lessons l where l.course_id = c.id) as total_lessons,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'order_index', m.order_index,
          'lessons', (
            select jsonb_agg(
              jsonb_build_object(
                'id', l.id,
                'title', l.title,
                'content_type', l.content_type,
                'order_index', l.order_index,
                'estimated_duration_minutes', l.estimated_duration_minutes,
                'is_previewable', l.is_previewable
              ) order by l.order_index asc
            )
            from public.lessons l
            where l.module_id = m.id
          )
        ) order by m.order_index asc
      )
      from public.modules m
      where m.course_id = c.id
    ) as modules
  from public.courses c
  left join public.profiles p on c.instructor_id = p.id
  where (p_course_slug is not null and c.slug = p_course_slug)
     or (p_course_id is not null and c.id = p_course_id);
end;
$function$;

-- -----------------------------------------------------------------------------
-- 16. complete_lesson_for_user: uuid params, SECURITY DEFINER, drop phantom
--     sections/category_id refs, fix certificates insert (no enrollment_id
--     column), fix create_app_notification call sites
-- -----------------------------------------------------------------------------

create or replace function public.complete_lesson_for_user(p_lesson_id uuid, p_user_id uuid default auth.uid())
 returns public.lesson_progress
 language plpgsql
 security definer
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
      and lp.is_completed = true;

    new_course_progress_percentage = least(100, (completed_mandatory_lessons_by_user * 100 / total_mandatory_lessons_in_course))::smallint;
  else
    select count(*) into total_lessons_in_course from public.lessons l_count where l_count.course_id = course_record.id;

    select count(distinct lp.lesson_id) into completed_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id and l_check.course_id = course_record.id and lp.is_completed = true;

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

-- -----------------------------------------------------------------------------
-- 17. complete_and_grade_quiz_attempt: uuid params, fix create_app_notification
--     call sites
-- -----------------------------------------------------------------------------

create or replace function public.complete_and_grade_quiz_attempt(p_quiz_attempt_id uuid, p_user_id uuid default auth.uid())
 returns public.quiz_attempts
 language plpgsql
 security definer
as $function$
declare
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  instructor_id_val uuid;
  total_score_for_attempt numeric(6,2);
  is_quiz_passed boolean;
  num_questions_awaiting_manual_grade int;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if quiz_attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.completed_at is not null then
    raise warning 'Quiz attempt % is already completed.', p_quiz_attempt_id;
    return quiz_attempt_record;
  end if;

  select * into quiz_record from public.quizzes where id = quiz_attempt_record.quiz_id;
  if quiz_record is null then
    raise exception 'Associated quiz (ID %) not found for attempt %.', quiz_attempt_record.quiz_id, p_quiz_attempt_id;
  end if;

  select * into lesson_record from public.lessons where id = quiz_record.lesson_id;

  select coalesce(sum(a.points_awarded), 0)
  into total_score_for_attempt
  from public.answers a
  where a.quiz_attempt_id = p_quiz_attempt_id and a.is_correct is not null;

  select count(*)
  into num_questions_awaiting_manual_grade
  from public.answers a
  where a.quiz_attempt_id = p_quiz_attempt_id and a.is_correct is null;

  if num_questions_awaiting_manual_grade > 0 then
    update public.quiz_attempts
    set
      score = total_score_for_attempt,
      completed_at = now(),
      updated_at = now()
    where id = p_quiz_attempt_id
    returning * into quiz_attempt_record;

    perform public.create_app_notification(
      p_user_id := p_user_id,
      p_type := 'quiz_graded',
      p_title := 'Quiz Submitted: ' || quiz_record.title,
      p_message := 'Your quiz "' || quiz_record.title || '" has been submitted. Some questions require manual grading. Provisional score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    select c.instructor_id into instructor_id_val
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = quiz_record.lesson_id;

    perform public.create_app_notification(
      p_user_id := instructor_id_val,
      p_type := 'new_assignment_submission',
      p_title := 'Quiz Needs Grading: ' || quiz_record.title,
      p_message := coalesce((select pf.full_name from public.profiles pf where pf.id = p_user_id), 'A student') || ' submitted the quiz "' || quiz_record.title || '" which requires manual grading.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    return quiz_attempt_record;
  end if;

  if quiz_record.passing_score_percentage is not null and quiz_attempt_record.max_score_possible > 0 then
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  elsif quiz_record.passing_score_percentage is null then
    is_quiz_passed = true;
  else
    is_quiz_passed = false;
  end if;

  update public.quiz_attempts
  set
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = now(),
    updated_at = now()
  where id = p_quiz_attempt_id
  returning * into quiz_attempt_record;

  if is_quiz_passed and lesson_record.is_mandatory then
    perform public.complete_lesson_for_user(quiz_record.lesson_id, p_user_id);
  end if;

  perform public.create_app_notification(
    p_user_id := p_user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Graded: ' || quiz_record.title,
    p_message := 'Your quiz "' || quiz_record.title || '" has been graded. Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (case when is_quiz_passed then 'Passed' else 'Failed' end) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id := p_quiz_attempt_id,
    p_actor_id := null
  );

  return quiz_attempt_record;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 18. instructor_grade_answer_and_update_quiz: uuid params, fix joins/calls
-- -----------------------------------------------------------------------------

create or replace function public.instructor_grade_answer_and_update_quiz(p_answer_id uuid, p_is_correct boolean, p_points_awarded numeric, p_instructor_feedback text default null::text, p_instructor_id uuid default auth.uid())
 returns public.quiz_attempts
 language plpgsql
 security definer
as $function$
declare
  answer_record public.answers;
  question_id_val uuid;
  quiz_attempt_id_val uuid;
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_rec public.lessons;
  course_id_val uuid;
  total_score_for_attempt numeric(6,2);
  is_quiz_passed boolean;
  num_questions_still_awaiting_manual_grade int;
  was_already_passed boolean;
begin
  select a.quiz_attempt_id, a.question_id
  into quiz_attempt_id_val, question_id_val
  from public.answers a
  where a.id = p_answer_id;

  if quiz_attempt_id_val is null then
    raise exception 'Answer ID % not found.', p_answer_id;
  end if;

  select qz.* into quiz_record
  from public.quizzes qz
  join public.questions q on qz.id = q.quiz_id
  where q.id = question_id_val;

  course_id_val := public.get_course_id_from_lesson(quiz_record.lesson_id);

  if not (public.is_course_instructor(p_instructor_id, course_id_val) or public.get_current_user_role() = 'admin') then
    raise exception 'Permission denied: Not an instructor for this course or an admin.';
  end if;

  update public.answers
  set
    is_correct = p_is_correct,
    points_awarded = p_points_awarded,
    feedback = coalesce(p_instructor_feedback, feedback)
  where id = p_answer_id
  returning * into answer_record;

  select * into quiz_attempt_record from public.quiz_attempts where id = answer_record.quiz_attempt_id;
  was_already_passed := quiz_attempt_record.passed is true;

  select coalesce(sum(a.points_awarded), 0)
  into total_score_for_attempt
  from public.answers a
  where a.quiz_attempt_id = quiz_attempt_record.id and a.points_awarded is not null;

  select count(*)
  into num_questions_still_awaiting_manual_grade
  from public.answers a
  where a.quiz_attempt_id = quiz_attempt_record.id and a.is_correct is null and a.id <> p_answer_id;

  if num_questions_still_awaiting_manual_grade > 0 then
    update public.quiz_attempts
    set score = total_score_for_attempt, updated_at = now()
    where id = quiz_attempt_record.id
    returning * into quiz_attempt_record;

    raise notice 'Answer graded. Quiz attempt % still has % other questions awaiting manual grading.', quiz_attempt_record.id, num_questions_still_awaiting_manual_grade;
    return quiz_attempt_record;
  end if;

  if quiz_record.passing_score_percentage is not null and quiz_attempt_record.max_score_possible > 0 then
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  elsif quiz_record.passing_score_percentage is null then
    is_quiz_passed = true;
  else
    is_quiz_passed = false;
  end if;

  update public.quiz_attempts
  set
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = coalesce(quiz_attempt_record.completed_at, now()),
    feedback_from_instructor = coalesce(quiz_attempt_record.feedback_from_instructor, '') || 'Answer ID ' || p_answer_id || ' graded. ',
    updated_at = now()
  where id = quiz_attempt_record.id
  returning * into quiz_attempt_record;

  if is_quiz_passed and not was_already_passed then
    select * into lesson_rec from public.lessons where id = quiz_record.lesson_id;
    if lesson_rec.is_mandatory then
      perform public.complete_lesson_for_user(quiz_record.lesson_id, quiz_attempt_record.user_id);
    end if;
  end if;

  perform public.create_app_notification(
    p_user_id := quiz_attempt_record.user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Update: ' || quiz_record.title,
    p_message := 'An answer in your quiz "' || quiz_record.title || '" has been graded by the instructor. New Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (case when is_quiz_passed then 'Passed' else 'Failed' end) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id := quiz_attempt_record.id,
    p_actor_id := p_instructor_id
  );

  return quiz_attempt_record;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 19. start_quiz_attempt: uuid params, course lookup via get_course_id_from_lesson,
--     and support for standalone quizzes (quizzes.lesson_id is nullable -- a
--     quiz with no lesson is a standalone quiz taken via entrance_code, with
--     no course/enrollment concept at all; see get_quiz_by_entrance_code()
--     below for the only way a client learns a standalone quiz's id)
-- -----------------------------------------------------------------------------

create or replace function public.start_quiz_attempt(p_quiz_id uuid, p_user_id uuid default auth.uid())
 returns public.quiz_attempts
 language plpgsql
 security definer
as $function$
declare
  enrollment_record public.enrollments;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  course_id_val uuid;
  previous_attempts_count smallint;
  new_quiz_attempt public.quiz_attempts;
  max_score_possible_for_quiz numeric(6,2);
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_record from public.quizzes where id = p_quiz_id;
  if quiz_record is null then
    raise exception 'Quiz not found: ID %', p_quiz_id;
  end if;

  if quiz_record.lesson_id is not null then
    -- Lesson-attached quiz: requires an active enrollment in the owning course.
    select * into lesson_record from public.lessons where id = quiz_record.lesson_id;
    if lesson_record is null then
      raise exception 'Associated lesson for quiz ID % not found (Lesson ID %)', p_quiz_id, quiz_record.lesson_id;
    end if;

    course_id_val := public.get_course_id_from_lesson(lesson_record.id);
    if course_id_val is null then
      raise exception 'Could not determine course for the quiz ID %.', p_quiz_id;
    end if;

    select * into enrollment_record
    from public.enrollments
    where user_id = p_user_id and course_id = course_id_val;

    if enrollment_record is null then
      raise exception 'User is not enrolled in the course containing this quiz.';
    end if;

    if enrollment_record.completed_at is not null then
      raise warning 'User has already completed this course. Still allowing quiz attempt.';
    end if;
  else
    -- Standalone quiz: no lesson/course/enrollment. Reaching this point already
    -- means the caller knows p_quiz_id, which (for a standalone quiz) is only
    -- discoverable via get_quiz_by_entrance_code(), so no further access check
    -- is needed here. enrollment_record stays null and quiz_attempts.enrollment_id
    -- is nullable to support exactly this case.
    enrollment_record := null;
  end if;

  select count(*) into previous_attempts_count
  from public.quiz_attempts
  where user_id = p_user_id and quiz_id = p_quiz_id;

  if quiz_record.max_attempts is not null and previous_attempts_count >= quiz_record.max_attempts then
    raise exception 'Maximum number of attempts (%) reached for quiz "%".', quiz_record.max_attempts, quiz_record.title;
  end if;

  select coalesce(sum(q.points), 0) into max_score_possible_for_quiz
  from public.questions q
  where q.quiz_id = p_quiz_id;

  insert into public.quiz_attempts (enrollment_id, quiz_id, user_id, attempt_number, max_score_possible)
  values (enrollment_record.id, p_quiz_id, p_user_id, previous_attempts_count + 1, max_score_possible_for_quiz)
  returning * into new_quiz_attempt;

  return new_quiz_attempt;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 20. submit_quiz_answer: uuid params + uuid[] options, add SECURITY DEFINER
--     (this is the function that was entirely unable to succeed before:
--     missing SECURITY DEFINER + no RLS policy + bigint params + missing
--     unique constraint, all fixed by this migration)
-- -----------------------------------------------------------------------------

create or replace function public.submit_quiz_answer(
  p_quiz_attempt_id uuid,
  p_question_id uuid,
  p_selected_option_ids uuid[] default null::uuid[],
  p_answer_text text default null::text,
  p_structured_answer jsonb default null::jsonb,
  p_user_id uuid default auth.uid()
)
 returns public.answers
 language plpgsql
 security definer
as $function$
declare
  quiz_attempt_record public.quiz_attempts;
  question_record public.questions;
  new_answer_record public.answers;
  is_answer_correct boolean := null;
  points_awarded_for_answer numeric(5,2) := 0;
  answer_feedback text := null;
  correct_ids uuid[];
  selected_ids_count int;
  correct_ids_count int;
  matching_correct_ids_count int;
  incorrectly_selected_ids_count int;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if quiz_attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.completed_at is not null then
    raise exception 'Cannot submit answers: Quiz attempt % is already completed.', p_quiz_attempt_id;
  end if;

  select * into question_record from public.questions where id = p_question_id and quiz_id = quiz_attempt_record.quiz_id;
  if question_record is null then
    raise exception 'Question ID % not found or does not belong to quiz ID %.', p_question_id, quiz_attempt_record.quiz_id;
  end if;

  case question_record.question_type
    when 'multiple_choice_single_correct', 'true_false', 'yes_no' then
      if array_length(p_selected_option_ids, 1) = 1 then
        select qo.is_correct, qo.feedback
        into is_answer_correct, answer_feedback
        from public.question_options qo
        where qo.question_id = p_question_id and qo.id = p_selected_option_ids[1];

        is_answer_correct := coalesce(is_answer_correct, false);
      else
        is_answer_correct := false;
        answer_feedback := 'Please select exactly one option.';
      end if;

    when 'multiple_choice_multiple_correct' then
      select array_agg(id) into correct_ids from public.question_options where question_id = p_question_id and is_correct = true;
      correct_ids_count := coalesce(array_length(correct_ids, 1), 0);
      selected_ids_count := coalesce(array_length(p_selected_option_ids, 1), 0);

      if selected_ids_count = 0 then
        is_answer_correct := (correct_ids_count = 0);
      else
        select count(*) into matching_correct_ids_count from unnest(p_selected_option_ids) sel_id where sel_id = any(correct_ids);
        select count(*) into incorrectly_selected_ids_count from unnest(p_selected_option_ids) sel_id where sel_id <> all(coalesce(correct_ids, array[]::uuid[]));

        if matching_correct_ids_count = correct_ids_count and incorrectly_selected_ids_count = 0 then
          is_answer_correct := true;
        else
          is_answer_correct := false;
          answer_feedback := 'One or more selected options are incorrect, or not all correct options were chosen.';
        end if;
      end if;

    when 'short_answer_text', 'long_answer_text', 'fill_in_the_blanks', 'matching', 'ordering', 'image_based_question' then
      is_answer_correct := null;
      answer_feedback := 'This answer will be reviewed by an instructor or requires specific processing.';

    else
      is_answer_correct := null;
      answer_feedback := 'Grading for this question type is not yet implemented.';
  end case;

  if is_answer_correct = true then
    points_awarded_for_answer := question_record.points;
  end if;

  insert into public.answers (
    quiz_attempt_id,
    question_id,
    selected_option_ids,
    answer_text,
    structured_answer,
    is_correct,
    points_awarded,
    feedback
  )
  values (
    p_quiz_attempt_id,
    p_question_id,
    p_selected_option_ids,
    p_answer_text,
    p_structured_answer,
    is_answer_correct,
    points_awarded_for_answer,
    answer_feedback
  )
  on conflict (quiz_attempt_id, question_id) do update set
    selected_option_ids = excluded.selected_option_ids,
    answer_text = excluded.answer_text,
    structured_answer = excluded.structured_answer,
    is_correct = excluded.is_correct,
    points_awarded = excluded.points_awarded,
    feedback = excluded.feedback,
    submitted_at = now()
  returning * into new_answer_record;

  return new_answer_record;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 21. enroll_user_in_course: fix dead enrollment_limit logic (-1 = unlimited)
-- -----------------------------------------------------------------------------

create or replace function public.enroll_user_in_course(p_course_id uuid, p_user_id uuid default auth.uid())
 returns public.enrollments
 language plpgsql
 security definer
as $function$
declare
  course_record public.courses;
  new_enrollment public.enrollments;
  current_enrollment_count int;
  user_profile public.profiles;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided to enroll in a course.';
  end if;

  select * into course_record from public.courses where id = p_course_id;
  select * into user_profile from public.profiles where id = p_user_id;

  if course_record is null then
    raise exception 'Course not found: ID %', p_course_id;
  end if;
  if user_profile is null then
    raise exception 'User profile not found: ID %', p_user_id;
  end if;

  if not course_record.is_published then
    raise exception 'Cannot enroll in an unpublished course: %', course_record.title;
  end if;

  -- Check if already enrolled
  if exists (select 1 from public.enrollments where user_id = p_user_id and course_id = p_course_id) then
    raise exception 'User % is already enrolled in course %.', user_profile.full_name, course_record.title;
  end if;

  -- Check enrollment limit (courses.enrollment_limit = -1 means unlimited)
  if course_record.enrollment_limit <> -1 then
    select count(*) into current_enrollment_count from public.enrollments where course_id = p_course_id;
    if current_enrollment_count >= course_record.enrollment_limit then
      raise exception 'Enrollment limit reached for course: %.', course_record.title;
    end if;
  end if;

  insert into public.enrollments (user_id, course_id)
  values (p_user_id, p_course_id)
  returning * into new_enrollment;

  -- Notification for instructor
  perform public.create_app_notification(
    p_user_id := course_record.instructor_id,
    p_type := 'new_course_enrollment',
    p_title := 'New Enrollment: ' || course_record.title,
    p_message := user_profile.full_name || ' has enrolled in your course "' || course_record.title || '".',
    p_related_entity_type := 'courses',
    p_related_entity_id := p_course_id,
    p_actor_id := p_user_id
  );

  return new_enrollment;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 22. New functions to support standalone (entrance_code-gated) quizzes and to
--     serve quiz question/option content to students WITHOUT the answer key.
--
--     Why these exist: a quiz with lesson_id IS NULL is a standalone quiz --
--     not tied to any course/lesson/enrollment -- that a student reaches only
--     by entering its entrance_code (see SCHEMA_REVIEW.md and the quizzes
--     table). Separately, question_options.is_correct/feedback and
--     questions.explanation must never be readable by a student before (or
--     instead of) actually taking the quiz, including via a direct
--     PostgREST/Postman call. RLS can only hide whole rows, not columns, so
--     section 23 below removes ALL direct student SELECT access to
--     public.questions/public.question_options, and the function below is the
--     only path a student has to read question/option content -- it
--     deliberately omits is_correct/feedback/explanation from its result, and
--     it only returns rows for a quiz_attempts row the calling user actually
--     owns (i.e. they must have already called start_quiz_attempt /
--     start_standalone_quiz_attempt for that quiz first).
-- -----------------------------------------------------------------------------

drop function if exists public.get_quiz_by_entrance_code(text);
drop function if exists public.get_quiz_questions_for_attempt(uuid, uuid);
drop function if exists public.start_standalone_quiz_attempt(text, uuid);

create or replace function public.get_quiz_by_entrance_code(p_entrance_code text)
 returns public.quizzes
 language plpgsql
 stable
 security definer
as $function$
declare
  found_quiz public.quizzes;
begin
  if p_entrance_code is null or btrim(p_entrance_code) = '' then
    raise exception 'An entrance code must be provided.';
  end if;

  select * into found_quiz
  from public.quizzes
  where entrance_code = upper(btrim(p_entrance_code));

  if found_quiz is null then
    raise exception 'No quiz found for that entrance code.';
  end if;

  return found_quiz;
end;
$function$;

-- Convenience wrapper for standalone quizzes: looks the quiz up by
-- entrance_code and immediately starts an attempt for it, in one call, so a
-- client never needs to learn a standalone quiz's id via any other route.
-- start_quiz_attempt() itself still works fine for lesson-attached quizzes.
create or replace function public.start_standalone_quiz_attempt(p_entrance_code text, p_user_id uuid default auth.uid())
 returns public.quiz_attempts
 language plpgsql
 security definer
as $function$
declare
  found_quiz public.quizzes;
begin
  found_quiz := public.get_quiz_by_entrance_code(p_entrance_code);

  if found_quiz.lesson_id is not null then
    raise exception 'Quiz "%" is attached to a course lesson; use start_quiz_attempt() with enrollment instead of an entrance code.', found_quiz.title;
  end if;

  return public.start_quiz_attempt(found_quiz.id, p_user_id);
end;
$function$;

-- The only way a student can read question/option content: scoped to a
-- quiz_attempts row they own, and excluding is_correct/feedback/explanation.
create or replace function public.get_quiz_questions_for_attempt(p_quiz_attempt_id uuid, p_user_id uuid default auth.uid())
 returns table (
   question_id uuid,
   question_text text,
   question_type public.question_type,
   order_index smallint,
   points smallint,
   hint text,
   image_content_block_id uuid,
   option_id uuid,
   option_text text,
   option_order_index smallint,
   match_target_text text
 )
 language plpgsql
 stable
 security definer
as $function$
declare
  attempt_record public.quiz_attempts;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  return query
  select
    q.id,
    q.question_text,
    q.question_type,
    q.order_index,
    q.points,
    q.hint,
    q.image_content_block_id,
    qo.id,
    qo.option_text,
    qo.order_index,
    qo.match_target_text
  from public.questions q
  left join public.question_options qo on qo.question_id = q.id
  where q.quiz_id = attempt_record.quiz_id
  order by q.order_index asc, qo.order_index asc;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 23. RLS policies for tables with zero policies (default-deny was blocking
--     all access), a missing student-facing policy on answers, and a redesign
--     of quizzes/questions/question_options access (moved from the original
--     section 9; see the note in section 9 above for why this had to move
--     after the function rewrites).
--
--     Redesign rationale (per product clarification on quizzes):
--       - A quiz with lesson_id IS NULL is "standalone": no course/lesson/
--         enrollment applies to it at all, and a student is meant to reach it
--         only by knowing its entrance_code. The original "Anyone can read
--         quizzes" policy (using (true)) let any authenticated user list/
--         browse every quiz row directly via PostgREST, including standalone
--         ones and their entrance_code -- defeating the entrance_code gate
--         entirely. It is dropped below and replaced with a scoped policy:
--         lesson-attached quizzes remain visible to enrolled
--         students/instructors/admins (so the app can list/show a course's
--         quizzes before starting one); standalone quizzes are NOT exposed
--         through this policy at all -- the only way to reach one is through
--         get_quiz_by_entrance_code()/start_standalone_quiz_attempt(), which
--         are SECURITY DEFINER and bypass RLS.
--       - questions/question_options no longer get a direct student SELECT
--         policy at all (the original "Enrolled users and staff can view
--         questions/question options" policies are dropped, not recreated).
--         That was the actual leak: it let a student read
--         question_options.is_correct/feedback directly via Postman before
--         ever attempting the quiz. Students now read question/option content
--         exclusively through get_quiz_questions_for_attempt() (section 22),
--         which never returns is_correct/feedback and requires ownership of an
--         in-progress quiz_attempts row. Instructors/admins keep full table
--         access via the existing "manage" policies (FOR ALL covers SELECT).
-- -----------------------------------------------------------------------------

-- quizzes: lesson-attached quizzes are visible to enrolled students, the
-- course instructor, and admins; standalone quizzes (lesson_id IS NULL) are
-- intentionally NOT covered here -- they are reachable only via
-- get_quiz_by_entrance_code()/start_standalone_quiz_attempt().
drop policy if exists "Anyone can read quizzes" on public.quizzes;

create policy "Enrolled users and staff can view lesson quizzes"
on public.quizzes for select
to authenticated
using (
  quizzes.lesson_id is not null
  and (
    public.get_current_user_role() = 'admin'
    or public.is_course_instructor(auth.uid(), public.get_course_id_from_lesson(quizzes.lesson_id))
    or public.is_enrolled(auth.uid(), public.get_course_id_from_lesson(quizzes.lesson_id))
  )
);

create policy "Instructors and admins manage quizzes"
on public.quizzes for all
to authenticated
using (
  public.get_current_user_role() = 'admin'
  or (
    quizzes.lesson_id is not null
    and public.is_course_instructor(auth.uid(), public.get_course_id_from_lesson(quizzes.lesson_id))
  )
)
with check (
  public.get_current_user_role() = 'admin'
  or (
    quizzes.lesson_id is not null
    and public.is_course_instructor(auth.uid(), public.get_course_id_from_lesson(quizzes.lesson_id))
  )
);

-- questions / question_options: instructors and admins can manage (and
-- therefore read) directly; students have NO direct SELECT policy here on
-- purpose (see rationale above) -- they read content exclusively through
-- get_quiz_questions_for_attempt().
create policy "Instructors and admins manage questions"
on public.questions for all
to authenticated
using (
  public.get_current_user_role() = 'admin'
  or public.is_course_instructor(
       auth.uid(),
       (select l.course_id from public.quizzes q join public.lessons l on q.lesson_id = l.id where q.id = questions.quiz_id)
     )
)
with check (
  public.get_current_user_role() = 'admin'
  or public.is_course_instructor(
       auth.uid(),
       (select l.course_id from public.quizzes q join public.lessons l on q.lesson_id = l.id where q.id = questions.quiz_id)
     )
);

create policy "Instructors and admins manage question options"
on public.question_options for all
to authenticated
using (
  public.get_current_user_role() = 'admin'
  or public.is_course_instructor(
       auth.uid(),
       (select l.course_id
          from public.questions q2
          join public.quizzes q on q2.quiz_id = q.id
          join public.lessons l on q.lesson_id = l.id
         where q2.id = question_options.question_id)
     )
)
with check (
  public.get_current_user_role() = 'admin'
  or public.is_course_instructor(
       auth.uid(),
       (select l.course_id
          from public.questions q2
          join public.quizzes q on q2.quiz_id = q.id
          join public.lessons l on q.lesson_id = l.id
         where q2.id = question_options.question_id)
     )
);

-- discussion_threads: visible to enrolled users/instructor/admin, authors can manage own
create policy "Enrolled users and staff can view discussion threads"
on public.discussion_threads for select
to authenticated
using (
  public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), discussion_threads.course_id)
  or public.is_enrolled(auth.uid(), discussion_threads.course_id)
);

create policy "Enrolled users can create discussion threads"
on public.discussion_threads for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.get_current_user_role() = 'admin'
    or public.is_course_instructor(auth.uid(), discussion_threads.course_id)
    or public.is_enrolled(auth.uid(), discussion_threads.course_id)
  )
);

create policy "Authors and staff can update discussion threads"
on public.discussion_threads for update
to authenticated
using (
  user_id = auth.uid()
  or public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), discussion_threads.course_id)
)
with check (
  user_id = auth.uid()
  or public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), discussion_threads.course_id)
);

create policy "Authors and staff can delete discussion threads"
on public.discussion_threads for delete
to authenticated
using (
  user_id = auth.uid()
  or public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), discussion_threads.course_id)
);

-- discussion_posts: visibility/management follows the parent thread's course
create policy "Enrolled users and staff can view discussion posts"
on public.discussion_posts for select
to authenticated
using (
  public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
  or public.is_enrolled(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
);

create policy "Enrolled users can create discussion posts"
on public.discussion_posts for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.get_current_user_role() = 'admin'
    or public.is_course_instructor(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
    or public.is_enrolled(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
  )
);

create policy "Authors and staff can update discussion posts"
on public.discussion_posts for update
to authenticated
using (
  user_id = auth.uid()
  or public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
)
with check (
  user_id = auth.uid()
  or public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
);

create policy "Authors and staff can delete discussion posts"
on public.discussion_posts for delete
to authenticated
using (
  user_id = auth.uid()
  or public.get_current_user_role() = 'admin'
  or public.is_course_instructor(auth.uid(), (select t.course_id from public.discussion_threads t where t.id = discussion_posts.thread_id))
);

-- answers: students need to see/manage their own answers; instructors need to grade them
create policy "Students can view their own answers"
on public.answers for select
to authenticated
using (
  (select qa.user_id from public.quiz_attempts qa where qa.id = answers.quiz_attempt_id) = auth.uid()
);

create policy "Instructors can view answers for their course quizzes"
on public.answers for select
to authenticated
using (
  public.is_course_instructor(
    auth.uid(),
    (select l.course_id
       from public.quiz_attempts qa
       join public.quizzes q on qa.quiz_id = q.id
       join public.lessons l on q.lesson_id = l.id
      where qa.id = answers.quiz_attempt_id)
  )
);

-- Note: inserts/updates to `answers` happen exclusively through the
-- SECURITY DEFINER functions submit_quiz_answer() and
-- instructor_grade_answer_and_update_quiz() above, so no separate
-- authenticated INSERT/UPDATE policy is added here on purpose.
