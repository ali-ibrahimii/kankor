-- `20260702151515_review_db_rls.sql` redefined is_school_member() without
-- SECURITY DEFINER, silently undoing the fix from
-- `20260628113234_fixed_school_members_rls.sql`. Without SECURITY DEFINER,
-- the function's own `select 1 from school_members` re-triggers the
-- school_members SELECT policy ("School members can see their fellow
-- members" USING (is_school_member(school_id))), which calls the function
-- again — infinite recursion ("stack depth limit exceeded") for any user
-- who has a school_members row and is fetched via an embedded/joined query
-- (e.g. profiles -> schoolMemberships in getCurrentUser()).
--
-- The same gap exists on get_school_member_role / is_school_owner /
-- is_school_editor: none of them are SECURITY DEFINER, so the ALL policy
-- "School owner and super admin can manage school_members"
-- USING (is_school_owner(school_id) OR is_admin()) recurses through
-- get_school_member_role's own `select ... from school_members` the same
-- way. Restoring SECURITY DEFINER on all four so their internal lookups
-- run as the function owner (which has BYPASSRLS) and skip re-evaluating
-- the policies that call them.
CREATE OR REPLACE FUNCTION public.is_school_member(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
select exists (
    select 1
    from school_members
    where school_id = p_school_id
      and user_id = p_user_id
);
$function$;

CREATE OR REPLACE FUNCTION public.get_school_member_role(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS school_member_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_role public.school_member_role;
begin
  select sm.role
  into v_role
  from public.school_members sm
  where sm.school_id = p_school_id
    and sm.user_id = p_user_id;

  return v_role;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_school_owner(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select get_school_member_role(p_school_id, p_user_id) = 'owner';
$function$;

CREATE OR REPLACE FUNCTION public.is_school_editor(p_school_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
    v_active_school_id uuid;
begin
    if p_school_id is not null then
        return get_school_member_role(p_school_id, p_user_id) = any (
            array[
                'admin'::public.school_member_role,
                'owner'::public.school_member_role,
                'manager'::public.school_member_role
            ]
        );
    end if;

    select active_school_id
    into v_active_school_id
    from profiles
    where id = p_user_id;

    if v_active_school_id is not null then
        return get_school_member_role(v_active_school_id, p_user_id) = any (
            array[
                'admin'::public.school_member_role,
                'owner'::public.school_member_role,
                'manager'::public.school_member_role
            ]
        );
    end if;

    return false;
end;
$function$;
