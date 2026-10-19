-- set_*_slug triggers only fire BEFORE INSERT, so rows created before the
-- slug column existed (courses, libraries, quizzes all have data; decks may
-- too in other environments) were left with slug = null. Backfill them here
-- so every existing row is reachable at its new slug-based URL.
--
-- Dedupe collisions (two rows slugifying to the same base) by suffixing
-- `-2`, `-3`, ... in creation order. Falls back to the row id when a title
-- slugifies to an empty string (e.g. punctuation-only titles).
with base as (
  select
    id,
    nullif(public.slugify(title), '') as base_slug,
    row_number() over (
      partition by nullif(public.slugify(title), '')
      order by created_at
    ) as rn
  from public.courses
  where slug is null or slug = ''
)
update public.courses c
set slug = coalesce(
  case when b.rn = 1 then b.base_slug else b.base_slug || '-' || b.rn end,
  c.id::text
)
from base b
where c.id = b.id;

with base as (
  select
    id,
    nullif(public.slugify(name), '') as base_slug,
    row_number() over (
      partition by nullif(public.slugify(name), '')
      order by created_at
    ) as rn
  from public.decks
  where slug is null or slug = ''
)
update public.decks d
set slug = coalesce(
  case when b.rn = 1 then b.base_slug else b.base_slug || '-' || b.rn end,
  d.id::text
)
from base b
where d.id = b.id;

with base as (
  select
    id,
    nullif(public.slugify(title), '') as base_slug,
    row_number() over (
      partition by nullif(public.slugify(title), '')
      order by created_at
    ) as rn
  from public.libraries
  where slug is null or slug = ''
)
update public.libraries l
set slug = coalesce(
  case when b.rn = 1 then b.base_slug else b.base_slug || '-' || b.rn end,
  l.id::text
)
from base b
where l.id = b.id;

with base as (
  select
    id,
    nullif(public.slugify(title), '') as base_slug,
    row_number() over (
      partition by nullif(public.slugify(title), '')
      order by created_at
    ) as rn
  from public.quizzes
  where slug is null or slug = ''
)
update public.quizzes q
set slug = coalesce(
  case when b.rn = 1 then b.base_slug else b.base_slug || '-' || b.rn end,
  q.id::text
)
from base b
where q.id = b.id;
