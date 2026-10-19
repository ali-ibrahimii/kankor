-- Fixes and extends the unified search RPC from 20260705120000_add_global_search.sql:
--   1. `libraries` branch referenced `l.author`, a column that doesn't exist on
--      `libraries` — every call to this function has been erroring. Use `l.desc`
--      as the subtitle instead, matching what the libraries card actually shows.
--   2. Every branch now also returns `slug` so the frontend can build slug-based
--      URLs directly instead of round-tripping through `id`.
--   3. Adds a `quiz` branch, scoped to `visibility = 'public'` (now readable by
--      anon per 20260706170100_public_quiz_access.sql). Deliberately does not
--      select `entrance_code` or any question content.
--
-- The return signature changes (new `slug` column), so the function must be
-- dropped and recreated rather than replaced in place.
drop function if exists public.search_suggestions(text, integer);

create or replace function public.search_suggestions(
  p_query text,
  p_limit_per_type integer default 4
)
returns table (
  result_type text,
  id uuid,
  title text,
  subtitle text,
  rank real,
  slug text
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
  select combined.result_type, combined.id, combined.title, combined.subtitle, combined.rank, combined.slug
  from (
    (
      select
        'course'::text as result_type,
        c.id,
        c.title,
        c.subtitle,
        (similarity(c.title, v_query)
          + (case when c.title ilike '%' || v_query || '%' then 0.5 else 0 end))::real as rank,
        c.slug
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
        l.desc,
        (similarity(l.title, v_query)
          + (case when l.title ilike '%' || v_query || '%' then 0.5 else 0 end))::real,
        l.slug
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
          + (case when d.name ilike '%' || v_query || '%' then 0.5 else 0 end))::real,
        d.slug
      from public.decks d
      where d.visibility = 'public'::public.visibility
        and (d.name ilike '%' || v_query || '%' or d.name % v_query)
      order by rank desc
      limit p_limit_per_type
    )
    union all
    (
      select
        'quiz'::text,
        q.id,
        q.title,
        q.description,
        (similarity(q.title, v_query)
          + (case when q.title ilike '%' || v_query || '%' then 0.5 else 0 end))::real,
        q.slug
      from public.quizzes q
      where q.visibility = 'public'::public.visibility
        and (q.title ilike '%' || v_query || '%' or q.title % v_query)
      order by rank desc
      limit p_limit_per_type
    )
  ) combined
  order by combined.rank desc, combined.result_type asc;
end;
$$;

grant execute on function public.search_suggestions(text, integer) to anon, authenticated;
