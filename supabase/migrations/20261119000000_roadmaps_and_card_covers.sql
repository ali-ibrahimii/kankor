-- ─────────────────────────────────────────────────────────────────────────
-- Roadmaps + cover images for catalog cards
--
-- 1. Roadmaps: an instructor/admin-authored learning path — an ordered list
--    of courses (the "roadmap items"). The public /roadmap page and the
--    courses hub read the published ones; the instructor/admin dashboards
--    manage them. RLS: anyone reads published roadmaps, the creator (or a
--    platform admin) manages their own.
-- 2. Card covers: `universities`, `quizzes`, `books`, `libraries`, `decks`
--    gain `cover_image_url` (stored in Cloudflare R2 like the other covers)
--    so every home-page card can show a real cover instead of stock art.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Cover columns -----------------------------------------------------------

alter table public.universities
  add column if not exists cover_image_url text;

alter table public.quizzes
  add column if not exists cover_image_url text;

alter table public.books
  add column if not exists cover_image_url text;

alter table public.libraries
  add column if not exists cover_image_url text;

alter table public.decks
  add column if not exists cover_image_url text;

-- 2. Roadmaps ----------------------------------------------------------------

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  accent text not null default 'violet',
  created_by uuid not null references auth.users (id),
  school_id uuid references public.schools (id),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  order_index integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique (roadmap_id, course_id)
);

create index if not exists roadmap_items_roadmap_order_idx
  on public.roadmap_items (roadmap_id, order_index);

create index if not exists roadmaps_created_by_idx
  on public.roadmaps (created_by);

create or replace function public.roadmaps_touch_updated_at()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists roadmaps_touch_updated_at on public.roadmaps;
create trigger roadmaps_touch_updated_at
before update on public.roadmaps
for each row execute function public.roadmaps_touch_updated_at();

-- RLS ------------------------------------------------------------------------

alter table public.roadmaps enable row level security;
alter table public.roadmap_items enable row level security;

drop policy if exists "published roadmaps are visible" on public.roadmaps;
create policy "published roadmaps are visible"
  on public.roadmaps for select
  to authenticated, anon
  using (is_published or created_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "creators insert roadmaps" on public.roadmaps;
create policy "creators insert roadmaps"
  on public.roadmaps for insert
  to authenticated
  with check (created_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "creators update roadmaps" on public.roadmaps;
create policy "creators update roadmaps"
  on public.roadmaps for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin(auth.uid()))
  with check (created_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "creators delete roadmaps" on public.roadmaps;
create policy "creators delete roadmaps"
  on public.roadmaps for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin(auth.uid()));

-- Items follow the parent roadmap's visibility/manageability.
create or replace function public.can_manage_roadmap(p_roadmap_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path to 'public'
as $function$
declare
  v_creator uuid;
begin
  if p_user_id is null then
    return false;
  end if;
  if public.is_admin(p_user_id) then
    return true;
  end if;
  select created_by into v_creator from public.roadmaps where id = p_roadmap_id;
  return v_creator = p_user_id;
end;
$function$;

drop policy if exists "items visible with roadmap" on public.roadmap_items;
create policy "items visible with roadmap"
  on public.roadmap_items for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id
        and (r.is_published or r.created_by = auth.uid() or public.is_admin(auth.uid()))
    )
  );

drop policy if exists "managers insert roadmap items" on public.roadmap_items;
create policy "managers insert roadmap items"
  on public.roadmap_items for insert
  to authenticated
  with check (public.can_manage_roadmap(roadmap_id));

drop policy if exists "managers update roadmap items" on public.roadmap_items;
create policy "managers update roadmap items"
  on public.roadmap_items for update
  to authenticated
  using (public.can_manage_roadmap(roadmap_id))
  with check (public.can_manage_roadmap(roadmap_id));

drop policy if exists "managers delete roadmap items" on public.roadmap_items;
create policy "managers delete roadmap items"
  on public.roadmap_items for delete
  to authenticated
  using (public.can_manage_roadmap(roadmap_id));

-- Grants ---------------------------------------------------------------------

grant usage on schema public to authenticated, anon;
grant select on public.roadmaps to authenticated, anon;
grant insert, update, delete on public.roadmaps to authenticated;
grant select on public.roadmap_items to authenticated, anon;
grant insert, update, delete on public.roadmap_items to authenticated;
grant select on public.roadmaps to service_role;
grant select on public.roadmap_items to service_role;
grant insert, update, delete on public.roadmaps to service_role;
grant insert, update, delete on public.roadmap_items to service_role;
