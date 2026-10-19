-- Cloudflare R2 course assets: private object storage for lesson videos,
-- documents/slides, audio, and answer sheet scans.
--
-- Objects in R2 are never publicly readable. Every read goes through a
-- server action that mints a short-lived presigned GET URL (see
-- src/lib/r2/actions.ts::getAssetSignedUrl) only after confirming — via this
-- table's RLS — that the caller can manage the course (instructor/admin/
-- school editor) or is enrolled in it. `lesson_content_blocks` gains
-- *_storage_key columns that hold the R2 object key (never a bare URL), so a
-- leaked row never leaks a working asset URL on its own.

create type "public"."course_asset_kind" as enum ('video', 'audio', 'document', 'answer_sheet');
create type "public"."course_asset_status" as enum ('pending', 'ready', 'failed');

create table "public"."course_assets" (
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

create index "course_assets_course_id_idx" on "public"."course_assets" ("course_id");
create index "course_assets_block_id_idx" on "public"."course_assets" ("block_id");

alter table "public"."course_assets" enable row level security;

create trigger "set_course_assets_updated_at"
  before update on "public"."course_assets"
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Course managers (instructor/admin/school editor) get full CRUD via
-- can_manage_course. Enrolled students can only SELECT — read access to the
-- metadata row is what lets getAssetSignedUrl mint them a download URL; they
-- never get insert/update/delete.

create policy "Course managers can view course assets"
  on "public"."course_assets"
  as permissive
  for select
  to authenticated
  using (public.can_manage_course(course_id) or public.is_enrolled(course_id));

create policy "Course managers can insert course assets"
  on "public"."course_assets"
  as permissive
  for insert
  to authenticated
  with check (public.can_manage_course(course_id) and uploaded_by = auth.uid());

create policy "Course managers can update course assets"
  on "public"."course_assets"
  as permissive
  for update
  to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

create policy "Course managers can delete course assets"
  on "public"."course_assets"
  as permissive
  for delete
  to authenticated
  using (public.can_manage_course(course_id));

grant select, insert, update, delete on table "public"."course_assets" to "authenticated";
grant all on table "public"."course_assets" to "service_role";

-- ── Storage keys on content blocks ─────────────────────────────────────────
-- These hold the R2 object key for self-hosted uploads. When set, the
-- corresponding *_url column (video_url/audio_url/document_url) is ignored
-- by the player in favor of a freshly signed URL for this key; when null,
-- the block falls back to its existing *_url field for external links
-- (YouTube, Vimeo, etc).

alter table "public"."lesson_content_blocks"
  add column "video_storage_key" text,
  add column "audio_storage_key" text,
  add column "document_storage_key" text;
