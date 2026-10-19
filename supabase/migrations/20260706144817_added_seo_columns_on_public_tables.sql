alter table "public"."courses" add column "seo_description" text;

alter table "public"."courses" add column "seo_title" text;

alter table "public"."decks" add column "seo_description" text;

alter table "public"."decks" add column "seo_title" text;

alter table "public"."decks" add column "slug" text;

alter table "public"."libraries" add column "seo_description" text;

alter table "public"."libraries" add column "seo_title" text;

alter table "public"."libraries" add column "slug" text;

alter table "public"."quizzes" add column "seo_description" text;

alter table "public"."quizzes" add column "seo_title" text;

alter table "public"."quizzes" add column "slug" text;

CREATE INDEX courses_slug_idx ON public.courses USING btree (slug);

CREATE UNIQUE INDEX courses_slug_unique_idx ON public.courses USING btree (slug);

CREATE INDEX decks_slug_idx ON public.decks USING btree (slug);

CREATE UNIQUE INDEX decks_slug_unique_idx ON public.decks USING btree (slug);

CREATE INDEX libraries_slug_idx ON public.libraries USING btree (slug);

CREATE UNIQUE INDEX libraries_slug_unique_idx ON public.libraries USING btree (slug);

CREATE INDEX quizzes_slug_idx ON public.quizzes USING btree (slug);

CREATE UNIQUE INDEX quizzes_slug_unique_idx ON public.quizzes USING btree (slug);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := public.slugify(new.title);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.slugify(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(trim(input_text)),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
END;
$function$
;

CREATE TRIGGER set_course_slug BEFORE INSERT ON public.courses FOR EACH ROW EXECUTE FUNCTION public.generate_slug();

CREATE TRIGGER set_deck_slug BEFORE INSERT ON public.decks FOR EACH ROW EXECUTE FUNCTION public.generate_slug();

CREATE TRIGGER set_library_slug BEFORE INSERT ON public.libraries FOR EACH ROW EXECUTE FUNCTION public.generate_slug();

CREATE TRIGGER set_quiz_slug BEFORE INSERT ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.generate_slug();


