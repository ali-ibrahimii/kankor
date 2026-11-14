-- ── Fix: permission helpers kept their old parameter names ───────────────────
--
-- Postgres rejects a CREATE OR REPLACE that renames input parameters
-- ("cannot change name of input parameter"). The replacements of
-- is_course_instructor / is_enrolled (20260702151515, 20260715020000) and
-- is_school_admin (20260622080039) renamed parameters, so on any database
-- that still carries the original definitions those statements failed and
-- the old bodies stayed in place.
--
-- That matters because callers pass the two uuids in *both* orders across
-- the schema: RLS policies use the original (user, course) order while the
-- can_manage_* helpers use (course, user). With the stale (user, course)
-- body, every (course, user) call is answered with the two arguments
-- swapped and silently returns false — e.g. instructors were denied the
-- course-cover upload ("Not authorized to upload images for this course or
-- school.").
--
-- The function cannot be dropped either: dozens of RLS policies depend on
-- it. So this migration heals whatever variant exists *in place*: it keeps
-- the current parameter names (they cannot be renamed without a drop) and
-- installs an order-forgiving body that matches (course, user) or
-- (user, course) — a course id and a user id are distinct uuids, so at most
-- one branch can match. It also restores the DEFAULT auth.uid() so
-- single-argument calls such as is_course_instructor(p_course_id) work.
--
-- The can_manage_* helpers are re-created idempotently as well, because on
-- databases where the failing migrations were rolled back wholesale they
-- may be missing entirely.

-- ── is_course_instructor ─────────────────────────────────────────────────────

do $$
declare
  v_names text[];
begin
  select p.proargnames into v_names
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'is_course_instructor'
    and p.pronargs = 2
    and p.proargtypes[0] = 'uuid'::regtype
    and p.proargtypes[1] = 'uuid'::regtype;

  if v_names is null then
    execute $f$
      create function public.is_course_instructor(p_course_id uuid, p_user_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $b$
        select exists (
          select 1
          from public.courses c
          where (c.id = p_course_id and c.instructor_id = p_user_id)
             or (c.id = p_user_id and c.instructor_id = p_course_id)
        );
      $b$
    $f$;
  elsif v_names[1] = 'p_course_id' then
    execute $f$
      create or replace function public.is_course_instructor(p_course_id uuid, p_user_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $b$
        select exists (
          select 1
          from public.courses c
          where (c.id = p_course_id and c.instructor_id = p_user_id)
             or (c.id = p_user_id and c.instructor_id = p_course_id)
        );
      $b$
    $f$;
  else
    -- Original parameter names: they cannot be renamed in place, so the
    -- forgiving body is installed under them. The first parameter has been
    -- called with a course id ever since 20260702151515; the second with a
    -- user id. The body accepts either order on top of that.
    execute $f$
      create or replace function public.is_course_instructor(check_user_id uuid, check_course_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $b$
        select exists (
          select 1
          from public.courses c
          where (c.id = check_user_id and c.instructor_id = check_course_id)
             or (c.id = check_course_id and c.instructor_id = check_user_id)
        );
      $b$
    $f$;
  end if;
end
$$;

-- ── is_enrolled ──────────────────────────────────────────────────────────────

do $$
declare
  v_names text[];
begin
  select p.proargnames into v_names
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'is_enrolled'
    and p.pronargs = 2
    and p.proargtypes[0] = 'uuid'::regtype
    and p.proargtypes[1] = 'uuid'::regtype;

  if v_names is null then
    execute $f$
      create function public.is_enrolled(p_course_id uuid, p_user_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $b$
        select exists (
          select 1
          from public.enrollments e
          where (e.course_id = p_course_id and e.user_id = p_user_id)
             or (e.course_id = p_user_id and e.user_id = p_course_id)
        );
      $b$
    $f$;
  elsif v_names[1] = 'p_course_id' then
    execute $f$
      create or replace function public.is_enrolled(p_course_id uuid, p_user_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $b$
        select exists (
          select 1
          from public.enrollments e
          where (e.course_id = p_course_id and e.user_id = p_user_id)
             or (e.course_id = p_user_id and e.user_id = p_course_id)
        );
      $b$
    $f$;
  else
    execute $f$
      create or replace function public.is_enrolled(check_user_id uuid, check_course_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $b$
        select exists (
          select 1
          from public.enrollments e
          where (e.course_id = check_user_id and e.user_id = check_course_id)
             or (e.course_id = check_course_id and e.user_id = check_user_id)
        );
      $b$
    $f$;
  end if;
end
$$;

-- ── is_school_admin ──────────────────────────────────────────────────────────
-- Same rename problem (uid → p_user_id); both variants keep (school, user)
-- order, so only the parameter names differ.

do $$
declare
  v_names text[];
begin
  select p.proargnames into v_names
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'is_school_admin'
    and p.pronargs = 2
    and p.proargtypes[0] = 'uuid'::regtype
    and p.proargtypes[1] = 'uuid'::regtype;

  if v_names is null then
    execute $f$
      create function public.is_school_admin(p_school_id uuid, p_user_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      set search_path = public
      as $b$
        select public.get_school_member_role(p_school_id, p_user_id) = 'owner';
      $b$
    $f$;
  elsif v_names[2] = 'p_user_id' then
    execute $f$
      create or replace function public.is_school_admin(p_school_id uuid, p_user_id uuid default auth.uid())
      returns boolean
      language sql
      stable
      set search_path = public
      as $b$
        select public.get_school_member_role(p_school_id, p_user_id) = 'owner';
      $b$
    $f$;
  else
    execute $f$
      create or replace function public.is_school_admin(p_school_id uuid, uid uuid default auth.uid())
      returns boolean
      language sql
      stable
      set search_path = public
      as $b$
        select public.get_school_member_role(p_school_id, uid) = 'owner';
      $b$
    $f$;
  end if;
end
$$;

-- ── can_manage_* helpers ─────────────────────────────────────────────────────
-- Re-created idempotently (their signatures never changed) so they exist on
-- databases where the failed migrations rolled back wholesale, and so they
-- keep matching the healed helper semantics above.

create or replace function public.can_manage_course(
  p_course_id uuid,
  p_school_id uuid default null,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
set search_path to 'public'
as $function$
declare
    v_school_id uuid := p_school_id;
begin
    if v_school_id is null then
        select school_id
        into v_school_id
        from courses
        where id = p_course_id;
    end if;

    return
        is_course_instructor(p_course_id, p_user_id)
        or is_admin(p_user_id)
        or is_school_editor(v_school_id, p_user_id);
end;
$function$;

create or replace function public.can_manage_quiz(
  p_quiz_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
set search_path to 'public'
as $function$
declare
    v_owner_id uuid;
    v_school_id uuid;
begin
    select
        q.user_id,
        q.school_id
    into
        v_owner_id,
        v_school_id
    from quizzes q
    where q.id = p_quiz_id;

    if v_owner_id is not null and v_owner_id = p_user_id then
        return true;
    end if;

    if is_admin(p_user_id) then
        return true;
    end if;

    if v_school_id is not null
       and is_school_editor(v_school_id, p_user_id) then
        return true;
    end if;

    return is_course_instructor(
        (
            select get_course_id_from_lesson(q.lesson_id)
            from quizzes q
            where q.id = p_quiz_id
        ),
        p_user_id
    );
end;
$function$;

create or replace function public.can_manage_image_owner(
  p_scope text,
  p_owner_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
set search_path to 'public'
as $function$
begin
  if p_owner_id is null then
    return false;
  end if;

  if public.is_admin(p_user_id) then
    return true;
  end if;

  return case p_scope
    when 'course' then public.can_manage_course(p_owner_id, null, p_user_id)
    when 'school' then public.is_school_editor(p_owner_id, p_user_id)
    when 'profile' then p_owner_id = p_user_id
    else false
  end;
end;
$function$;
