drop policy "School members can see their fellow members" on "public"."school_members";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_school_member(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
select exists (
    select 1
    from school_members
    where school_id = p_school_id
      and user_id = p_user_id
);
$function$
;

grant select on table "public"."profiles" to "authenticated";


  create policy "School members can see their fellow members"
  on "public"."school_members"
  as permissive
  for select
  to public
using (public.is_school_member(school_id));



