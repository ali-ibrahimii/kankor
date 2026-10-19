-- `deck` was added to bookmarkable_item_type directly against the live
-- database in a previous session (same drift pattern as
-- get_course_details.enrollment, see 20260708090000_entity_detail_rpcs.sql)
-- so flashcard decks could be bookmarked; captured here so
-- `supabase db reset` doesn't lose it.
--
-- Kept in its own migration/transaction: a newly added enum value can't be
-- referenced by literal in the same transaction that adds it.
alter type "public"."bookmarkable_item_type" add value if not exists 'deck';
