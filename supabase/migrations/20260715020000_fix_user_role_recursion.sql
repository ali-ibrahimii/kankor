-- This migration defines the core RLS helper functions as SECURITY DEFINER.
-- Without SECURITY DEFINER, the internal select queries on tables within these
-- functions evaluate under the active user's privileges, which triggers their
-- respective RLS policies. If the policies call functions that run queries
-- on the same tables (or related tables in a cycle), PostgreSQL hits a stack
-- depth limit exceeded error (infinite recursion).
-- Adding STABLE SECURITY DEFINER makes the functions execute as the owner
-- (which has BYPASSRLS) and avoids triggering RLS when checking access rights.

-- 1. User role helper functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
 RETURNS public.user_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
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

CREATE OR REPLACE FUNCTION public.is_user_a(role public.user_role, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
declare
  v_role public.user_role;
begin
  v_role := get_user_role(user_id);

  return v_role = role;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  return is_user_a('admin'::public.user_role, user_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_instructor(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  return is_user_a('instructor'::public.user_role, user_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_student(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  return is_user_a('student'::public.user_role, user_id);
end;
$function$;


-- 2. Classroom helper functions
CREATE OR REPLACE FUNCTION public.is_classroom_instructor(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select exists (
    select 1
    from public.classroom_members cm
    where cm.classroom_id = p_classroom_id
      and cm.user_id = p_user_id
      and cm.role in ('owner','instructor')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_classroom_member(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select exists (
    select 1
    from public.classroom_members cm
    where cm.classroom_id = p_classroom_id
      and cm.user_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_resource_shared_with_user(p_resource_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select exists (
    select 1
    from public.classroom_resources cr
    join public.classroom_members cm
      on cm.classroom_id = cr.classroom_id
    where cr.resource_id = p_resource_id
      and cm.user_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_view_classroom(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select public.is_admin(p_user_id) or public.is_classroom_member(p_classroom_id, p_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_classroom(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select public.is_admin(p_user_id) or public.is_classroom_instructor(p_classroom_id, p_user_id);
$function$;


-- 3. Enrollment/Course/Quiz helper functions
CREATE OR REPLACE FUNCTION public.is_enrolled(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select exists (
    select 1
    from public.enrollments
    where course_id = p_course_id
      and user_id = p_user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_course_instructor(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
    select exists (
        select 1
        from public.courses
        where id = p_course_id
          and instructor_id = p_user_id
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_enrolled_deck(p_deck_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
    select exists (
        select 1
        from public.enrollments e
        where e.deck_id = p_deck_id
          and e.user_id = p_user_id
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_quiz_public(p_quiz_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  select exists (
     select 1 
     from public.quizzes q
     where q.id = p_quiz_id
     and q.visibility = 'public'::public.visibility
  );
$function$;
