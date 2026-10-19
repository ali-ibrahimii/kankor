drop function if exists "public"."get_course_details"(p_course_slug text, p_course_id uuid);

alter table "public"."profiles" add column "slug" text;

CREATE UNIQUE INDEX profiles_slug_key ON public.profiles USING btree (slug);

alter table "public"."profiles" add constraint "profiles_slug_key" UNIQUE using index "profiles_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.extract_email_username(email text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT split_part(email, '@', 1);
$function$
;

create type "public"."item_type" as ("id" uuid, "name" text);

create type "public"."user_info" as ("id" text, "slug" text, "email" text, "name" text, "avatar" text);

CREATE OR REPLACE FUNCTION public.generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  candidate_slug text;
  slug_taken boolean;
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    IF TG_TABLE_NAME = 'decks' THEN
      base_slug := public.slugify(NEW.name);
    ELSIF TG_TABLE_NAME = 'profiles' THEN
      base_slug := public.slugify(extract_email_username(NEW.email));
    ELSE
      base_slug := public.slugify(NEW.title);
    END IF;

    candidate_slug := base_slug;

    LOOP
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.%I WHERE slug = $1)',
        TG_TABLE_NAME
      )
      INTO slug_taken
      USING candidate_slug;

      EXIT WHEN NOT slug_taken;

      candidate_slug := base_slug || '-' || floor(random() * 9000 + 1000)::int;
    END LOOP;

    NEW.slug := candidate_slug;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, title text, slug text, subtitle text, description text, seo_title text, seo_description text, instructor public.user_info, level public.course_level, language public.language_enum, cover_image_url text, promo_video_url text, welcome_message text, learning_objectives text[], prerequisites text[], is_published boolean, published_at timestamp with time zone, is_free boolean, price numeric, currency character, enrollment_limit integer, estimated_duration_hours integer, created_at timestamp with time zone, updated_at timestamp with time zone, average_rating numeric, total_reviews bigint, total_enrollments bigint, total_lessons integer, modules jsonb, subject public.item_type, book public.item_type, grade public.item_type)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
begin
  if p_course_slug is null and p_course_id is null then
    raise exception 'Either course slug or course ID must be provided.';
  end if;

  return query
  select
    c.id,
    c.title,
    c.slug,
    c.subtitle,
    c.description,
    c.seo_title,
    c.seo_description,
    ROW(
    c.instructor_id,
    p.slug,
    p.email,
    p.full_name,
    p.avatar_url 
    )::user_info,
    c.level,
    c.language,
    c.cover_image_url,
    c.promo_video_url,
    c.welcome_message,
    c.learning_objectives,
    c.prerequisites,
    c.is_published,
    c.published_at,
    c.is_free,
    c.price,
    c.currency,
    c.enrollment_limit,
    c.estimated_duration_hours,
    c.created_at,
    c.updated_at,
    (select avg(r.rating)::numeric(2,1) from public.reviews r where r.course_id = c.id) as average_rating,
    (select count(r.id) from public.reviews r where r.course_id = c.id) as total_reviews,
    (select count(e.id) from public.enrollments e where e.course_id = c.id) as total_enrollments,
    (select count(l.id)::integer from public.lessons l where l.course_id = c.id) as total_lessons,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'order_index', m.order_index,
          'lessons', (
            select jsonb_agg(
              jsonb_build_object(
  'id', l.id,
  'title', l.title,
  'content_type', l.content_type,
  'order_index', l.order_index,
  'estimated_duration_minutes', l.estimated_duration_minutes,
  'is_previewable', l.is_previewable,
  'lesson_progress',
    CASE
      WHEN auth.uid() IS NOT NULL THEN (
        SELECT jsonb_build_object(
          'id', lp.id,
          'is_completed', lp.is_completed,
          'completed_at', lp.completed_at,
          'last_accessed_at', lp.last_accessed_at,
          'video_progress_seconds', lp.video_progress_seconds
        )
        FROM public.lesson_progress lp
        WHERE lp.user_id = auth.uid()
          AND lp.lesson_id = l.id
        LIMIT 1
      )
      ELSE NULL
    END
) order by l.order_index asc
            )
            from public.lessons l
            where l.module_id = m.id
          )
        ) order by m.order_index asc
      )
      from public.modules m
      where m.course_id = c.id
    ) as modules,
    ROW(
      s.id,
      s.name
    )::item_type as subject,
    ROW(
      b.id,
      b.name
    )::item_type as book,
    ROW(
      g.id,
      g.name
    )::item_type as grade
  from public.courses c
  left join public.profiles p on c.instructor_id = p.id
  left join public.subjects s on s.id = c.subject_id
  left join public.books b on b.id = c.book_id
  left join public.grades g on g.id = c.grade_id
  where (p_course_slug is not null and c.slug = p_course_slug)
     or (p_course_id is not null and c.id = p_course_id);
end;
$function$
;

grant select on table "public"."lessons" to "public";

grant select on table "public"."modules" to "public";

CREATE TRIGGER set_profile_slug BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_slug();


