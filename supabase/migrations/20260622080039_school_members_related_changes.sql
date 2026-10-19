drop policy "School admins manage members of their own school" on "public"."school_members";

drop policy "Super admins manage all school members" on "public"."school_members";

alter table "public"."school_members" drop constraint "school_members_school_user_unique";

drop function if exists "public"."is_school_admin"(p_school_id uuid, uid uuid);

drop function if exists "public"."is_super_admin"(uid uuid);

drop function if exists "public"."is_user_a"(role public.user_role);

drop function if exists "public"."school_member_role"(p_school_id uuid, uid uuid);

drop index if exists "public"."idx_school_members_school_id";

drop index if exists "public"."idx_school_members_user_id";

drop index if exists "public"."school_members_school_user_unique";

alter table "public"."school_members" alter column "role" drop default;

alter type "public"."school_member_role" rename to "school_member_role__old_version_to_be_dropped";

create type "public"."school_member_role" as enum ('owner', 'admin', 'instructor', 'manager', 'staff', 'viewer');

alter table "public"."school_members" alter column role type "public"."school_member_role" using role::text::"public"."school_member_role";

alter table "public"."school_members" alter column "role" set default 'staff'::public.school_member_role;

drop type "public"."school_member_role__old_version_to_be_dropped";

alter table "public"."school_members" alter column "role" set default 'viewer'::public.school_member_role;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_school_member_role(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.school_member_role
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_school_admin(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select get_school_member_role(p_school_id, p_user_id) = 'owner';
$function$
;

CREATE OR REPLACE FUNCTION public.is_school_owner(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select get_school_member_role(p_school_id, p_user_id) = 'owner';
$function$
;


  create policy "School owner and super admin can manage school_members"
  on "public"."school_members"
  as permissive
  for all
  to authenticated
using ((public.is_school_owner(school_id) OR public.is_admin()))
with check ((public.is_school_owner(school_id) OR public.is_admin()));



