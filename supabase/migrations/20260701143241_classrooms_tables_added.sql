create type "public"."classroom_material_type" as enum ('lesson', 'pdf', 'video', 'document', 'link', 'practice', 'exam', 'other');

create type "public"."classroom_role" as enum ('owner', 'instructor', 'assistant', 'student');

create type "public"."shareable_type" as enum ('deck', 'course', 'library', 'quiz');


  create table "public"."classroom_announcements" (
    "id" uuid not null default gen_random_uuid(),
    "classroom_id" uuid not null,
    "author_id" uuid not null,
    "message" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."classroom_announcements" enable row level security;


  create table "public"."classroom_folders" (
    "id" uuid not null default gen_random_uuid(),
    "classroom_id" uuid not null,
    "name" text not null,
    "sort_order" integer default 0
      );


alter table "public"."classroom_folders" enable row level security;


  create table "public"."classroom_material_files" (
    "id" uuid not null default gen_random_uuid(),
    "material_id" uuid not null,
    "file_name" text not null,
    "file_path" text not null,
    "mime_type" text,
    "file_size" bigint,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."classroom_material_files" enable row level security;


  create table "public"."classroom_materials" (
    "id" uuid not null default gen_random_uuid(),
    "classroom_id" uuid not null,
    "created_by" uuid not null,
    "title" text not null,
    "description" text,
    "type" public.classroom_material_type not null default 'other'::public.classroom_material_type,
    "published" boolean not null default true,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "folder_id" uuid
      );


alter table "public"."classroom_materials" enable row level security;


  create table "public"."classroom_members" (
    "id" uuid not null default gen_random_uuid(),
    "classroom_id" uuid not null,
    "user_id" uuid not null,
    "role" public.classroom_role not null default 'student'::public.classroom_role,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."classroom_members" enable row level security;


  create table "public"."classroom_resources" (
    "id" uuid not null default gen_random_uuid(),
    "classroom_id" uuid not null,
    "resource_type" public.shareable_type not null,
    "resource_id" uuid not null,
    "shared_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."classroom_resources" enable row level security;


  create table "public"."classrooms" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "description" text,
    "cover_image" text,
    "join_code" text not null,
    "is_archived" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."classrooms" enable row level security;

CREATE UNIQUE INDEX classroom_announcements_pkey ON public.classroom_announcements USING btree (id);

CREATE UNIQUE INDEX classroom_folders_pkey ON public.classroom_folders USING btree (id);

CREATE UNIQUE INDEX classroom_material_files_pkey ON public.classroom_material_files USING btree (id);

CREATE UNIQUE INDEX classroom_materials_pkey ON public.classroom_materials USING btree (id);

CREATE UNIQUE INDEX classroom_members_classroom_id_user_id_key ON public.classroom_members USING btree (classroom_id, user_id);

CREATE UNIQUE INDEX classroom_members_pkey ON public.classroom_members USING btree (id);

CREATE UNIQUE INDEX classroom_resources_classroom_id_resource_type_resource_id_key ON public.classroom_resources USING btree (classroom_id, resource_type, resource_id);

CREATE UNIQUE INDEX classroom_resources_pkey ON public.classroom_resources USING btree (id);

CREATE UNIQUE INDEX classrooms_join_code_key ON public.classrooms USING btree (join_code);

CREATE UNIQUE INDEX classrooms_pkey ON public.classrooms USING btree (id);

CREATE INDEX idx_classroom_members_role ON public.classroom_members USING btree (role);

CREATE INDEX idx_classroom_members_user ON public.classroom_members USING btree (user_id);

CREATE INDEX idx_classrooms_join_code ON public.classrooms USING btree (join_code);

CREATE INDEX idx_classrooms_owner ON public.classrooms USING btree (user_id);

alter table "public"."classroom_announcements" add constraint "classroom_announcements_pkey" PRIMARY KEY using index "classroom_announcements_pkey";

alter table "public"."classroom_folders" add constraint "classroom_folders_pkey" PRIMARY KEY using index "classroom_folders_pkey";

alter table "public"."classroom_material_files" add constraint "classroom_material_files_pkey" PRIMARY KEY using index "classroom_material_files_pkey";

alter table "public"."classroom_materials" add constraint "classroom_materials_pkey" PRIMARY KEY using index "classroom_materials_pkey";

alter table "public"."classroom_members" add constraint "classroom_members_pkey" PRIMARY KEY using index "classroom_members_pkey";

alter table "public"."classroom_resources" add constraint "classroom_resources_pkey" PRIMARY KEY using index "classroom_resources_pkey";

alter table "public"."classrooms" add constraint "classrooms_pkey" PRIMARY KEY using index "classrooms_pkey";

alter table "public"."classroom_announcements" add constraint "classroom_announcements_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) not valid;

alter table "public"."classroom_announcements" validate constraint "classroom_announcements_author_id_fkey";

alter table "public"."classroom_announcements" add constraint "classroom_announcements_classroom_id_fkey" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_announcements" validate constraint "classroom_announcements_classroom_id_fkey";

alter table "public"."classroom_folders" add constraint "classroom_folders_classroom_id_fkey" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_folders" validate constraint "classroom_folders_classroom_id_fkey";

alter table "public"."classroom_material_files" add constraint "classroom_material_files_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.classroom_materials(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_material_files" validate constraint "classroom_material_files_material_id_fkey";

alter table "public"."classroom_materials" add constraint "classroom_materials_classroom_id_fkey" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_materials" validate constraint "classroom_materials_classroom_id_fkey";

alter table "public"."classroom_materials" add constraint "classroom_materials_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."classroom_materials" validate constraint "classroom_materials_created_by_fkey";

alter table "public"."classroom_materials" add constraint "classroom_materials_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES public.classroom_folders(id) not valid;

alter table "public"."classroom_materials" validate constraint "classroom_materials_folder_id_fkey";

alter table "public"."classroom_members" add constraint "classroom_members_classroom_id_fkey" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_members" validate constraint "classroom_members_classroom_id_fkey";

alter table "public"."classroom_members" add constraint "classroom_members_classroom_id_user_id_key" UNIQUE using index "classroom_members_classroom_id_user_id_key";

alter table "public"."classroom_members" add constraint "classroom_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_members" validate constraint "classroom_members_user_id_fkey";

alter table "public"."classroom_resources" add constraint "classroom_resources_classroom_id_fkey" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE CASCADE not valid;

alter table "public"."classroom_resources" validate constraint "classroom_resources_classroom_id_fkey";

alter table "public"."classroom_resources" add constraint "classroom_resources_classroom_id_resource_type_resource_id_key" UNIQUE using index "classroom_resources_classroom_id_resource_type_resource_id_key";

alter table "public"."classroom_resources" add constraint "classroom_resources_shared_by_fkey" FOREIGN KEY (shared_by) REFERENCES public.profiles(id) not valid;

alter table "public"."classroom_resources" validate constraint "classroom_resources_shared_by_fkey";

alter table "public"."classrooms" add constraint "classrooms_join_code_key" UNIQUE using index "classrooms_join_code_key";

alter table "public"."classrooms" add constraint "classrooms_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."classrooms" validate constraint "classrooms_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_manage_classroom(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select is_admin(p_user_id) or is_classroom_instructor(p_classroom_id, p_user_id);
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_classroom(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select is_admin(p_user_id) or is_classroom_member(p_classroom_id, p_user_id);
$function$
;

CREATE OR REPLACE FUNCTION public.is_classroom_instructor(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select exists (
    select 1
    from classroom_members cm
    where cm.classroom_id = p_classroom_id
      and cm.user_id = p_user_id
      and cm.role in ('owner','instructor')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_classroom_member(p_classroom_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from classroom_members cm
    where cm.classroom_id = p_classroom_id
      and cm.user_id = p_user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_resource_shared_with_user(p_resource_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.classroom_resources cr
    join public.classroom_members cm
      on cm.classroom_id = cr.classroom_id
    where cr.resource_id = p_resource_id
      and cm.user_id = p_user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_any_of(p_roles public.user_role[], p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select public.get_user_role(p_user_id) = any(p_roles)
$function$
;

grant references on table "public"."classroom_announcements" to "anon";

grant trigger on table "public"."classroom_announcements" to "anon";

grant truncate on table "public"."classroom_announcements" to "anon";

grant references on table "public"."classroom_announcements" to "authenticated";

grant trigger on table "public"."classroom_announcements" to "authenticated";

grant truncate on table "public"."classroom_announcements" to "authenticated";

grant select on table "public"."classroom_announcements" to "powersync_role";

grant references on table "public"."classroom_announcements" to "service_role";

grant trigger on table "public"."classroom_announcements" to "service_role";

grant truncate on table "public"."classroom_announcements" to "service_role";

grant references on table "public"."classroom_folders" to "anon";

grant trigger on table "public"."classroom_folders" to "anon";

grant truncate on table "public"."classroom_folders" to "anon";

grant references on table "public"."classroom_folders" to "authenticated";

grant trigger on table "public"."classroom_folders" to "authenticated";

grant truncate on table "public"."classroom_folders" to "authenticated";

grant select on table "public"."classroom_folders" to "powersync_role";

grant references on table "public"."classroom_folders" to "service_role";

grant trigger on table "public"."classroom_folders" to "service_role";

grant truncate on table "public"."classroom_folders" to "service_role";

grant references on table "public"."classroom_material_files" to "anon";

grant trigger on table "public"."classroom_material_files" to "anon";

grant truncate on table "public"."classroom_material_files" to "anon";

grant references on table "public"."classroom_material_files" to "authenticated";

grant trigger on table "public"."classroom_material_files" to "authenticated";

grant truncate on table "public"."classroom_material_files" to "authenticated";

grant select on table "public"."classroom_material_files" to "powersync_role";

grant references on table "public"."classroom_material_files" to "service_role";

grant trigger on table "public"."classroom_material_files" to "service_role";

grant truncate on table "public"."classroom_material_files" to "service_role";

grant references on table "public"."classroom_materials" to "anon";

grant trigger on table "public"."classroom_materials" to "anon";

grant truncate on table "public"."classroom_materials" to "anon";

grant references on table "public"."classroom_materials" to "authenticated";

grant trigger on table "public"."classroom_materials" to "authenticated";

grant truncate on table "public"."classroom_materials" to "authenticated";

grant select on table "public"."classroom_materials" to "powersync_role";

grant references on table "public"."classroom_materials" to "service_role";

grant trigger on table "public"."classroom_materials" to "service_role";

grant truncate on table "public"."classroom_materials" to "service_role";

grant references on table "public"."classroom_members" to "anon";

grant trigger on table "public"."classroom_members" to "anon";

grant truncate on table "public"."classroom_members" to "anon";

grant references on table "public"."classroom_members" to "authenticated";

grant trigger on table "public"."classroom_members" to "authenticated";

grant truncate on table "public"."classroom_members" to "authenticated";

grant select on table "public"."classroom_members" to "powersync_role";

grant references on table "public"."classroom_members" to "service_role";

grant trigger on table "public"."classroom_members" to "service_role";

grant truncate on table "public"."classroom_members" to "service_role";

grant references on table "public"."classroom_resources" to "anon";

grant trigger on table "public"."classroom_resources" to "anon";

grant truncate on table "public"."classroom_resources" to "anon";

grant references on table "public"."classroom_resources" to "authenticated";

grant trigger on table "public"."classroom_resources" to "authenticated";

grant truncate on table "public"."classroom_resources" to "authenticated";

grant select on table "public"."classroom_resources" to "powersync_role";

grant references on table "public"."classroom_resources" to "service_role";

grant trigger on table "public"."classroom_resources" to "service_role";

grant truncate on table "public"."classroom_resources" to "service_role";

grant references on table "public"."classrooms" to "anon";

grant trigger on table "public"."classrooms" to "anon";

grant truncate on table "public"."classrooms" to "anon";

grant references on table "public"."classrooms" to "authenticated";

grant trigger on table "public"."classrooms" to "authenticated";

grant truncate on table "public"."classrooms" to "authenticated";

grant select on table "public"."classrooms" to "powersync_role";

grant references on table "public"."classrooms" to "service_role";

grant trigger on table "public"."classrooms" to "service_role";

grant truncate on table "public"."classrooms" to "service_role";


  create policy "A classroom manager can add a classroom_announcements"
  on "public"."classroom_announcements"
  as permissive
  for insert
  to public
with check (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can delete a classroom_announcements"
  on "public"."classroom_announcements"
  as permissive
  for delete
  to public
using (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can update a classroom_announcements"
  on "public"."classroom_announcements"
  as permissive
  for update
  to public
using (public.can_manage_classroom(classroom_id))
with check (public.can_manage_classroom(classroom_id));



  create policy "Admin and classroom member and view classroom_announcements"
  on "public"."classroom_announcements"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_classroom_member(classroom_id)));



  create policy "A classroom manager can delete a classroom_folders"
  on "public"."classroom_folders"
  as permissive
  for delete
  to public
using (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can insert a classroom_folders"
  on "public"."classroom_folders"
  as permissive
  for insert
  to public
with check (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can update a classroom_folders"
  on "public"."classroom_folders"
  as permissive
  for update
  to public
using (public.can_manage_classroom(classroom_id))
with check (public.can_manage_classroom(classroom_id));



  create policy "Admin and classroom members can view classroom_folders"
  on "public"."classroom_folders"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_classroom_member(classroom_id)));



  create policy "A classroom manager can create a classroom_material_files"
  on "public"."classroom_material_files"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.classroom_materials m
  WHERE ((m.id = classroom_material_files.material_id) AND public.can_manage_classroom(m.classroom_id)))));



  create policy "A classroom manager can delete a classroom_material_files"
  on "public"."classroom_material_files"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.classroom_materials m
  WHERE ((m.id = classroom_material_files.material_id) AND public.can_manage_classroom(m.classroom_id)))));



  create policy "A classroom manager can update a classroom_material_files"
  on "public"."classroom_material_files"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.classroom_materials m
  WHERE ((m.id = classroom_material_files.material_id) AND public.can_manage_classroom(m.classroom_id)))))
with check ((EXISTS ( SELECT 1
   FROM public.classroom_materials m
  WHERE ((m.id = classroom_material_files.material_id) AND public.can_manage_classroom(m.classroom_id)))));



  create policy "Admin and classroom members can view classroom_material_files"
  on "public"."classroom_material_files"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.classroom_materials m
  WHERE ((m.id = classroom_material_files.material_id) AND (public.is_admin() OR public.is_classroom_member(m.classroom_id))))));



  create policy "A classroom manager can create a classroom_materials"
  on "public"."classroom_materials"
  as permissive
  for insert
  to public
with check (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can remove a classroom_materials"
  on "public"."classroom_materials"
  as permissive
  for delete
  to public
using (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can update a classroom_materials"
  on "public"."classroom_materials"
  as permissive
  for update
  to public
using (public.can_manage_classroom(classroom_id))
with check (public.can_manage_classroom(classroom_id));



  create policy "Admin and classroom members can view a classroom_materials"
  on "public"."classroom_materials"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_classroom_member(classroom_id)));



  create policy "A classroom manager can remove a classroom_members"
  on "public"."classroom_members"
  as permissive
  for delete
  to authenticated
using (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can update classroom_members"
  on "public"."classroom_members"
  as permissive
  for update
  to authenticated
using (public.can_manage_classroom(classroom_id))
with check (public.can_manage_classroom(classroom_id));



  create policy "Admin and classroom manager can add a classroom_members"
  on "public"."classroom_members"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_classroom(classroom_id));



  create policy "Admin and classroom members can view classroom_members"
  on "public"."classroom_members"
  as permissive
  for select
  to authenticated
using ((public.is_admin() OR public.is_classroom_member(classroom_id)));



  create policy "A classroom manager can add a classroom_resources"
  on "public"."classroom_resources"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_classroom(classroom_id));



  create policy "A classroom manager can remove a classroom_resources"
  on "public"."classroom_resources"
  as permissive
  for delete
  to authenticated
using (public.can_manage_classroom(classroom_id));



  create policy "Admin and classroom memebers can view a classroom_resources"
  on "public"."classroom_resources"
  as permissive
  for select
  to authenticated
using ((public.is_admin() OR public.is_classroom_member(classroom_id)));



  create policy "Admin and a classroom owner can delete it"
  on "public"."classrooms"
  as permissive
  for delete
  to authenticated
using ((public.is_admin() OR public.is_owner(user_id)));



  create policy "Admin and instructor can create a classrooms"
  on "public"."classrooms"
  as permissive
  for insert
  to authenticated
with check (public.is_user_any_of(ARRAY['admin'::public.user_role, 'instructor'::public.user_role]));



  create policy "Admin and instructor can update a classrooms"
  on "public"."classrooms"
  as permissive
  for update
  to authenticated
using (public.can_manage_classroom(id))
with check (public.can_manage_classroom(id));



  create policy "All classroom members can view a classrooms"
  on "public"."classrooms"
  as permissive
  for select
  to authenticated
using (public.can_view_classroom(id));



  create policy "Resource members can read courses"
  on "public"."courses"
  as permissive
  for select
  to authenticated
using (public.is_resource_shared_with_user(id));



  create policy "Resource members can read decks"
  on "public"."decks"
  as permissive
  for select
  to authenticated
using (public.is_resource_shared_with_user(id));



  create policy "Resource members can read quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using (public.is_resource_shared_with_user(id));


CREATE TRIGGER set_classroom_folders_updated_at BEFORE UPDATE ON public.classroom_folders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classroom_material_files_updated_at BEFORE UPDATE ON public.classroom_material_files FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classroom_materials_updated_at BEFORE UPDATE ON public.classroom_materials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classroom_members_updated_at BEFORE UPDATE ON public.classroom_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classroom_resources_updated_at BEFORE UPDATE ON public.classroom_resources FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


