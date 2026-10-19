drop policy "Admin and instructor can update a classrooms" on "public"."classrooms";

drop policy "All classroom members can view a classrooms" on "public"."classrooms";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_classroom_owner_as_classroom_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO classroom_members (
        classroom_id,
        user_id,
        role
    )
    VALUES (
        NEW.id,
        NEW.user_id,
        'owner'::classroom_role
    );

    RETURN NEW;
END;
$function$
;

grant delete on table "public"."classroom_announcements" to "authenticated";

grant insert on table "public"."classroom_announcements" to "authenticated";

grant update on table "public"."classroom_announcements" to "authenticated";

grant delete on table "public"."classroom_folders" to "authenticated";

grant insert on table "public"."classroom_folders" to "authenticated";

grant update on table "public"."classroom_folders" to "authenticated";

grant delete on table "public"."classroom_material_files" to "authenticated";

grant insert on table "public"."classroom_material_files" to "authenticated";

grant update on table "public"."classroom_material_files" to "authenticated";

grant delete on table "public"."classroom_materials" to "authenticated";

grant insert on table "public"."classroom_materials" to "authenticated";

grant update on table "public"."classroom_materials" to "authenticated";

grant delete on table "public"."classroom_members" to "authenticated";

grant insert on table "public"."classroom_members" to "authenticated";

grant update on table "public"."classroom_members" to "authenticated";

grant delete on table "public"."classroom_resources" to "authenticated";

grant insert on table "public"."classroom_resources" to "authenticated";

grant update on table "public"."classroom_resources" to "authenticated";

grant delete on table "public"."classrooms" to "authenticated";

grant insert on table "public"."classrooms" to "authenticated";

grant update on table "public"."classrooms" to "authenticated";


  create policy "Admin and instructor can update a classrooms"
  on "public"."classrooms"
  as permissive
  for update
  to authenticated
using ((public.is_owner(user_id) OR public.can_manage_classroom(id)))
with check ((public.is_owner(user_id) OR public.can_manage_classroom(id)));



  create policy "All classroom members can view a classrooms"
  on "public"."classrooms"
  as permissive
  for select
  to authenticated
using ((public.can_view_classroom(id) OR public.is_owner(user_id)));


CREATE TRIGGER classroom_insert_owner AFTER INSERT ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.insert_classroom_owner_as_classroom_member();


