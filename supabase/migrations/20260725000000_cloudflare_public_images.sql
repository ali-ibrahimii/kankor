-- Cloudflare R2 public images: covers/logos that appear on catalog cards,
-- school pages and profile avatars.
--
-- Why a separate table from `course_assets`: those rows are deliberately
-- private (video/audio/document/answer_sheet) and can only be read through a
-- short-lived signed URL gated by enrollment. Card covers are the opposite —
-- they are rendered to anonymous visitors on the public catalog, so they must
-- be world-readable and CDN-cacheable.
--
-- Object keys follow `{directory}/{ownerId}/...` (see src/lib/r2/public-images.ts):
--   courses/{courseId}/cover/{uuid}-{file}
--   schools/{schoolId}/cover|logo/{uuid}-{file}
--   avatars/{userId}/{uuid}-{file}
-- The table is the record of "which images belong to which course/school",
-- so access can still be authorized, audited and cleaned up even though the
-- bytes themselves are public.

-- ── Permission helper ───────────────────────────────────────────────────────
-- One place that answers "may this user upload images for this owner?".
-- Reuses the existing course/school role functions so image uploads follow
-- exactly the same rules as editing the course or the school.

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

-- ── Table ───────────────────────────────────────────────────────────────────

create table "public"."image_assets" (
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

create index "image_assets_owner_idx" on "public"."image_assets" ("scope", "owner_id");
create index "image_assets_uploaded_by_idx" on "public"."image_assets" ("uploaded_by");

create trigger "set_image_assets_updated_at"
  before update on "public"."image_assets"
  for each row execute function public.handle_updated_at();

alter table "public"."image_assets" enable row level security;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Read: anyone (including `anon`) — these are the pictures on public cards.
-- Only rows that actually finished uploading are visible, so a half-uploaded
-- or failed object never leaks into a page.
-- Write: only whoever manages the owner (course instructor/school editor/admin).

create policy "Anyone can view ready images"
  on "public"."image_assets"
  as permissive
  for select
  to anon, authenticated
  using (status = 'ready');

create policy "Owners can view their pending images"
  on "public"."image_assets"
  as permissive
  for select
  to authenticated
  using (public.can_manage_image_owner(scope, owner_id));

create policy "Owners can insert images"
  on "public"."image_assets"
  as permissive
  for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.can_manage_image_owner(scope, owner_id)
  );

create policy "Owners can update images"
  on "public"."image_assets"
  as permissive
  for update
  to authenticated
  using (public.can_manage_image_owner(scope, owner_id))
  with check (public.can_manage_image_owner(scope, owner_id));

create policy "Owners can delete images"
  on "public"."image_assets"
  as permissive
  for delete
  to authenticated
  using (public.can_manage_image_owner(scope, owner_id));

grant select on table "public"."image_assets" to "anon";
grant select, insert, update, delete on table "public"."image_assets" to "authenticated";
grant all on table "public"."image_assets" to "service_role";

-- ── Cover columns ───────────────────────────────────────────────────────────
-- Cards still read a plain URL column (as they always have), so an upload
-- writes the Cloudflare URL there. Keeping the URL denormalized means no
-- read path needs an extra join, and existing rows (Firebase/Google Storage)
-- keep working untouched.

alter table "public"."schools"
  add column "cover_image_url" text,
  add column "logo_url" text;

comment on column "public"."schools"."cover_image_url" is
  'Cloudflare R2 public URL (or an external URL) used as the school card/page cover.';
comment on column "public"."schools"."logo_url" is
  'Cloudflare R2 public URL of the school logo.';
