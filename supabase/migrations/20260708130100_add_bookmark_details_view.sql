-- Single view backing the "Bookmarks" dashboard page: resolves each
-- bookmark row to the title/slug/description of whichever entity it points
-- to, so the client doesn't need one query per item_type.
--
-- `security_invoker = true` means this runs with the *caller's* privileges,
-- not the view owner's — so the bookmarks table's own-row RLS
-- ("Allow users to select their own bookmarks") and each joined table's own
-- select policies are what actually gate the results. Without it, a view
-- owned by a superuser/service role would bypass those policies entirely.
create or replace view public.bookmark_details
with (security_invoker = on)
as
select
  b.id,
  b.user_id,
  b.item_type,
  b.item_id,
  b.notes,
  b.created_at,
  b.updated_at,
  coalesce(c.title, d.name, l.title, q.title) as title,
  coalesce(c.slug, d.slug, l.slug, q.slug) as slug,
  coalesce(c.description, d.description, l.desc, q.description) as description,
  c.cover_image_url
from public.bookmarks b
left join public.courses c on b.item_type = 'course' and c.id = b.item_id
left join public.decks d on b.item_type = 'deck' and d.id = b.item_id
left join public.libraries l on b.item_type = 'library' and l.id = b.item_id
left join public.quizzes q on b.item_type = 'quiz' and q.id = b.item_id;

grant select on public.bookmark_details to authenticated;
