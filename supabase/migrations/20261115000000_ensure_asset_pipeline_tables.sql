-- Ensure the R2 asset pipelines exist — idempotent, safe on any database state.
--
-- Why: some databases ended up only partially migrated. The permission
-- helpers could exist while `image_assets` / `course_assets` do not, which
-- surfaced as "Could not create the upload record" on image upload with a
-- PostgREST 42P01 ("relation ... does not exist"). Every statement below is
-- guarded, so running this file on a fully migrated, partially migrated, or
-- freshly healed database all converge to the same schema.

-- ── Enum types ──────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'course_asset_kind'
  ) then
    execute 'create type public.course_asset_kind as enum (''video'', ''audio'', ''document'', ''answer_sheet'')';
  end if;
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'course_asset_status'
  ) then
    execute 'create type public.course_asset_status as enum (''pending'', ''ready'', ''failed'')';
  end if;
end $$;

-- ── course_assets (video/audio/document uploads) ────────────────────────────

create table if not exists "public"."course_assets" (
  "id" uuid not null default gen_random_uuid(),
  "course_id" uuid not null references public.courses(id) on delete cascade,
  "block_id" uuid references public.lesson_content_blocks(id) on delete set null,
  "kind" public.course_asset_kind not null,
  "storage_key" text not null,
  "original_filename" text not null,
  "mime_type" text not null,
  "size_bytes" bigint,
  "status" public.course_asset_status not null default 'pending',
  "uploaded_by" uuid not null references auth.users(id) on delete cascade,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "course_assets_pkey" primary key ("id"),
  constraint "course_assets_storage_key_key" unique ("storage_key")
);

create index if not exists "course_assets_course_id_idx"
  on "public"."course_assets" ("course_id");
create index if not exists "course_assets_block_id_idx"
  on "public"."course_assets" ("block_id");

alter table "public"."course_assets" enable row level security;

drop trigger if exists "set_course_assets_updated_at" on "public"."course_assets";
create trigger "set_course_assets_updated_at"
  before update on "public"."course_assets"
  for each row execute function public.handle_updated_at();

drop policy if exists "Course managers can view course assets" on "public"."course_assets";
create policy "Course managers can view course assets"
  on "public"."course_assets"
  as permissive
  for select
  to authenticated
  using (public.can_manage_course(course_id) or public.is_enrolled(course_id));

drop policy if exists "Course managers can insert course assets" on "public"."course_assets";
create policy "Course managers can insert course assets"
  on "public"."course_assets"
  as permissive
  for insert
  to authenticated
  with check (public.can_manage_course(course_id) and uploaded_by = auth.uid());

drop policy if exists "Course managers can update course assets" on "public"."course_assets";
create policy "Course managers can update course assets"
  on "public"."course_assets"
  as permissive
  for update
  to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists "Course managers can delete course assets" on "public"."course_assets";
create policy "Course managers can delete course assets"
  on "public"."course_assets"
  as permissive
  for delete
  to authenticated
  using (public.can_manage_course(course_id));

grant select, insert, update, delete on table "public"."course_assets" to "authenticated";
grant all on table "public"."course_assets" to "service_role";

-- Storage keys on content blocks (R2 object keys for self-hosted uploads).
alter table "public"."lesson_content_blocks"
  add column if not exists "video_storage_key" text,
  add column if not exists "audio_storage_key" text,
  add column if not exists "document_storage_key" text;

-- ── image_assets (covers/logos/avatars) ─────────────────────────────────────

create table if not exists "public"."image_assets" (
  "id" uuid not null default gen_random_uuid(),
  "scope" text not null,
  "owner_id" uuid not null,
  "storage_key" text not null,
  "original_filename" text not null,
  "mime_type" text not null,
  "size_bytes" bigint,
  "status" public.course_asset_status not null default 'pending',
  "uploaded_by" uuid not null references auth.users(id) on delete cascade,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "image_assets_pkey" primary key ("id"),
  constraint "image_assets_storage_key_key" unique ("storage_key"),
  constraint "image_assets_scope_check" check ("scope" in ('course', 'school', 'profile'))
);

create index if not exists "image_assets_owner_idx"
  on "public"."image_assets" ("scope", "owner_id");
create index if not exists "image_assets_uploaded_by_idx"
  on "public"."image_assets" ("uploaded_by");

alter table "public"."image_assets" enable row level security;

drop trigger if exists "set_image_assets_updated_at" on "public"."image_assets";
create trigger "set_image_assets_updated_at"
  before update on "public"."image_assets"
  for each row execute function public.handle_updated_at();

drop policy if exists "Anyone can view ready images" on "public"."image_assets";
create policy "Anyone can view ready images"
  on "public"."image_assets"
  as permissive
  for select
  to anon, authenticated
  using (status = 'ready');

drop policy if exists "Owners can view their pending images" on "public"."image_assets";
create policy "Owners can view their pending images"
  on "public"."image_assets"
  as permissive
  for select
  to authenticated
  using (public.can_manage_image_owner(scope, owner_id));

drop policy if exists "Owners can insert images" on "public"."image_assets";
create policy "Owners can insert images"
  on "public"."image_assets"
  as permissive
  for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.can_manage_image_owner(scope, owner_id)
  );

drop policy if exists "Owners can update images" on "public"."image_assets";
create policy "Owners can update images"
  on "public"."image_assets"
  as permissive
  for update
  to authenticated
  using (public.can_manage_image_owner(scope, owner_id))
  with check (public.can_manage_image_owner(scope, owner_id));

drop policy if exists "Owners can delete images" on "public"."image_assets";
create policy "Owners can delete images"
  on "public"."image_assets"
  as permissive
  for delete
  to authenticated
  using (public.can_manage_image_owner(scope, owner_id));

grant select on table "public"."image_assets" to "anon";
grant select, insert, update, delete on table "public"."image_assets" to "authenticated";
grant all on table "public"."image_assets" to "service_role";

-- Cover columns on schools (card/page cover + logo URLs).
alter table "public"."schools"
  add column if not exists "cover_image_url" text,
  add column if not exists "logo_url" text;

comment on column "public"."schools"."cover_image_url" is
  'Cloudflare R2 public URL (or an external URL) used as the school card/page cover.';
comment on column "public"."schools"."logo_url" is
  'Cloudflare R2 public URL of the school logo.';
