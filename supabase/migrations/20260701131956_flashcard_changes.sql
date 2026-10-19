create type "public"."visibility" as enum ('public', 'private', 'classmate');

drop policy "Allow users to manage their own decks" on "public"."decks";

drop policy "Enable delete for users based on user_id" on "public"."flashcards";

drop policy "Enable insert for users based on user_id" on "public"."flashcards";

drop policy "allow select builtin for anon" on "public"."flashcards";

drop policy "allow select builtin or own for auth" on "public"."flashcards";

alter table "public"."enrollments" drop constraint "enrollments_course_id_fkey";

alter table "public"."decks" drop column "daily_limit";

alter table "public"."decks" add column "visibility" public.visibility not null default 'private'::public.visibility;

alter table "public"."enrollments" add column "deck_id" uuid;

alter table "public"."enrollments" add column "flashcard_daily_limit" smallint;

alter table "public"."flashcards" add column "deck_id" uuid;

alter table "public"."enrollments" add constraint "enrollments_deck_id_fkey" FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE RESTRICT not valid;

alter table "public"."enrollments" validate constraint "enrollments_deck_id_fkey";

alter table "public"."flashcards" add constraint "flashcards_deck_id_fkey" FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE not valid;

alter table "public"."flashcards" validate constraint "flashcards_deck_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT not valid;

alter table "public"."enrollments" validate constraint "enrollments_course_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_enrolled_deck(p_deck_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    select exists (
        select 1
        from enrollments e
        where e.deck_id = p_deck_id
          and e.user_id = p_user_id
    );
$function$
;


  create policy "Anyone can see public decks"
  on "public"."decks"
  as permissive
  for select
  to authenticated
using ((visibility = 'public'::public.visibility));



  create policy "Anyone can view their enrolled decks"
  on "public"."decks"
  as permissive
  for select
  to authenticated
using (public.is_enrolled_deck(id));



  create policy "Users can create their own decks"
  on "public"."decks"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "Users can delete their own decks"
  on "public"."decks"
  as permissive
  for delete
  to authenticated
using (public.is_owner(user_id));



  create policy "Users can update their own decks"
  on "public"."decks"
  as permissive
  for update
  to authenticated
using (public.is_owner(user_id))
with check (public.is_owner(user_id));



  create policy "Users can view their own decks"
  on "public"."decks"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Anyone can delete their own flashcards"
  on "public"."flashcards"
  as permissive
  for delete
  to authenticated
using (public.is_owner(user_id));



  create policy "Anyone can insert their own flashcards"
  on "public"."flashcards"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "Anyone can read flashcards of enrolled deck"
  on "public"."flashcards"
  as permissive
  for select
  to authenticated
using (public.is_enrolled_deck(deck_id));



  create policy "Anyone can select their own flashcards"
  on "public"."flashcards"
  as permissive
  for select
  to authenticated
using (public.is_owner(user_id));



  create policy "Anyone select builtin flashcards"
  on "public"."flashcards"
  as permissive
  for select
  to authenticated
using ((creation = 'built-in'::public.creation_enum));



