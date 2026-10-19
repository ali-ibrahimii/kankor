-- Global search: typo-tolerant, cross-table search over published courses,
-- library books, and public flashcard decks. Powers the navbar search-as-you-type
-- suggestions and backs the full "/search" results page.

-- pg_trgm gives us fast, index-accelerated ILIKE '%term%' matching plus a
-- similarity() score we can use to rank fuzzy/typo matches.
create extension if not exists "pg_trgm" with schema "extensions";

create index if not exists idx_courses_title_trgm
  on public.courses using gin (title extensions.gin_trgm_ops);

create index if not exists idx_libraries_title_trgm
  on public.libraries using gin (title extensions.gin_trgm_ops);

create index if not exists idx_decks_name_trgm
  on public.decks using gin (name extensions.gin_trgm_ops);

-- Public decks should be discoverable by anonymous visitors too, the same way
-- published courses ("Anyone can view a published course") and library books
-- ("Enable read access for all users") are already exposed to the `public` role.
drop policy if exists "Anyone can see public decks" on "public"."decks";

create policy "Anyone can see public decks"
on "public"."decks"
as permissive
for select
to public
using (visibility = 'public'::public.visibility);

-- Unified ranked search across the three public catalogs. Runs as SECURITY DEFINER
-- so it can query across tables in one call, but every branch re-applies the same
-- visibility rule already enforced by RLS (is_published for courses, none for
-- libraries, visibility = 'public' for decks) so it never surfaces anything a
-- signed-out visitor couldn't already select directly.
create or replace function public.search_suggestions(
  p_query text,
  p_limit_per_type integer default 4
)
returns table (
  result_type text,
  id uuid,
  title text,
  subtitle text,
  rank real
)
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_query text := trim(coalesce(p_query, ''));
begin
  if v_query = '' then
    return;
  end if;

  return query
  select combined.result_type, combined.id, combined.title, combined.subtitle, combined.rank
  from (
    (
      select
        'course'::text as result_type,
        c.id,
        c.title,
        c.subtitle,
        (similarity(c.title, v_query)
          + (case when c.title ilike '%' || v_query || '%' then 0.5 else 0 end))::real as rank
      from public.courses c
      where c.is_published = true
        and (c.title ilike '%' || v_query || '%' or c.title % v_query)
      order by rank desc
      limit p_limit_per_type
    )
    union all
    (
      select
        'library'::text,
        l.id,
        l.title,
        l.author,
        (similarity(l.title, v_query)
          + (case when l.title ilike '%' || v_query || '%' then 0.5 else 0 end))::real
      from public.libraries l
      where l.title ilike '%' || v_query || '%' or l.title % v_query
      order by rank desc
      limit p_limit_per_type
    )
    union all
    (
      select
        'deck'::text,
        d.id,
        d.name,
        d.description,
        (similarity(d.name, v_query)
          + (case when d.name ilike '%' || v_query || '%' then 0.5 else 0 end))::real
      from public.decks d
      where d.visibility = 'public'::public.visibility
        and (d.name ilike '%' || v_query || '%' or d.name % v_query)
      order by rank desc
      limit p_limit_per_type
    )
  ) combined
  order by combined.rank desc, combined.result_type asc;
end;
$$;

grant execute on function public.search_suggestions(text, integer) to anon, authenticated;
