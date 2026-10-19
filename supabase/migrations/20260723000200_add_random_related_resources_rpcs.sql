-- Add structural relationship columns to decks and quizzes if missing
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS grade_id uuid REFERENCES public.grades(id) ON DELETE SET NULL;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES public.books(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS grade_id uuid REFERENCES public.grades(id) ON DELETE SET NULL;

-- Drop functions to redefine their signatures
DROP FUNCTION IF EXISTS public.get_related_decks(uuid[], uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_decks(uuid[], uuid, uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_quizzes(uuid[], uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_quizzes(uuid[], uuid, uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_libraries(uuid[], uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_libraries(uuid[], uuid, uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_courses(uuid[], uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.get_related_courses(uuid[], uuid, uuid, uuid, uuid, integer);

-- 1. get_related_decks
CREATE FUNCTION public.get_related_decks(
  p_related_ids uuid[] DEFAULT '{}'::uuid[],
  p_book_id uuid DEFAULT NULL::uuid,
  p_subject_id uuid DEFAULT NULL::uuid,
  p_grade_id uuid DEFAULT NULL::uuid,
  p_school_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 3
)
 RETURNS TABLE(
   id uuid,
   name text,
   slug text,
   description text,
   is_free boolean
 )
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'pg_catalog'
 AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select d.id, d.name, d.slug, d.description, d.is_free
    from public.decks d
    where d.visibility = 'public'
      and d.id = any(p_related_ids);
  else
    return query
    select d.id, d.name, d.slug, d.description, d.is_free
    from public.decks d
    where d.visibility = 'public'
      and (
        (p_book_id is not null and d.book_id = p_book_id)
        or (p_subject_id is not null and d.subject_id = p_subject_id)
        or (p_grade_id is not null and d.grade_id = p_grade_id)
        or (p_school_id is not null and d.school_id = p_school_id)
      )
    order by random()
    limit p_limit;
  end if;
end;
$function$;

-- 2. get_related_quizzes
CREATE FUNCTION public.get_related_quizzes(
  p_related_ids uuid[] DEFAULT '{}'::uuid[],
  p_book_id uuid DEFAULT NULL::uuid,
  p_subject_id uuid DEFAULT NULL::uuid,
  p_grade_id uuid DEFAULT NULL::uuid,
  p_school_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 3
)
 RETURNS TABLE(
   id uuid,
   title text,
   slug text,
   description text,
   is_free boolean,
   time_limit_minutes integer,
   passing_score_percentage smallint,
   max_attempts smallint,
   instructions text,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'pg_catalog'
 AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select q.id, q.title, q.slug, q.description, q.is_free, q.time_limit_minutes, q.passing_score_percentage, q.max_attempts, q.instructions, q.created_at
    from public.quizzes q
    where q.visibility = 'public'
      and q.id = any(p_related_ids);
  else
    return query
    select q.id, q.title, q.slug, q.description, q.is_free, q.time_limit_minutes, q.passing_score_percentage, q.max_attempts, q.instructions, q.created_at
    from public.quizzes q
    where q.visibility = 'public'
      and (
        (p_book_id is not null and q.book_id = p_book_id)
        or (p_subject_id is not null and q.subject_id = p_subject_id)
        or (p_grade_id is not null and q.grade_id = p_grade_id)
        or (p_school_id is not null and q.school_id = p_school_id)
      )
    order by random()
    limit p_limit;
  end if;
end;
$function$;

-- 3. get_related_libraries
CREATE FUNCTION public.get_related_libraries(
  p_related_ids uuid[] DEFAULT '{}'::uuid[],
  p_book_id uuid DEFAULT NULL::uuid,
  p_subject_id uuid DEFAULT NULL::uuid,
  p_grade_id uuid DEFAULT NULL::uuid,
  p_school_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 3
)
 RETURNS TABLE(
   id uuid,
   title text,
   slug text,
   "desc" text,
   uri text,
   file_path text,
   category_id uuid,
   grade_id uuid,
   subject_id uuid,
   book_id uuid,
   updated_at timestamp with time zone,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'pg_catalog'
 AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select l.id, l.title, l.slug, l.desc, l.uri, l.file_path, l.category_id, l.grade_id, l.subject_id, l.book_id, l.updated_at, l.created_at
    from public.libraries l
    where l.id = any(p_related_ids);
  else
    return query
    select l.id, l.title, l.slug, l.desc, l.uri, l.file_path, l.category_id, l.grade_id, l.subject_id, l.book_id, l.updated_at, l.created_at
    from public.libraries l
    where (
      (p_book_id is not null and l.book_id = p_book_id)
      or (p_subject_id is not null and l.subject_id = p_subject_id)
      or (p_grade_id is not null and l.grade_id = p_grade_id)
    )
    order by random()
    limit p_limit;
  end if;
end;
$function$;

-- 4. get_related_courses
CREATE FUNCTION public.get_related_courses(
  p_related_ids uuid[] DEFAULT '{}'::uuid[],
  p_book_id uuid DEFAULT NULL::uuid,
  p_subject_id uuid DEFAULT NULL::uuid,
  p_grade_id uuid DEFAULT NULL::uuid,
  p_school_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 3
)
 RETURNS TABLE(
   id uuid,
   slug text,
   title text,
   subtitle text,
   cover_image_url text,
   is_free boolean,
   price numeric,
   price_credits integer,
   currency character,
   average_rating numeric,
   level course_level,
   language language_enum,
   created_at timestamp with time zone,
   updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'pg_catalog'
 AS $function$
begin
  if array_length(p_related_ids, 1) > 0 then
    return query
    select c.id, c.slug, c.title, c.subtitle, c.cover_image_url, c.is_free, c.price, c.price_credits, c.currency, c.average_rating, c.level, c.language, c.created_at, c.updated_at
    from public.courses c
    where c.is_published = true
      and c.id = any(p_related_ids);
  else
    return query
    select c.id, c.slug, c.title, c.subtitle, c.cover_image_url, c.is_free, c.price, c.price_credits, c.currency, c.average_rating, c.level, c.language, c.created_at, c.updated_at
    from public.courses c
    where c.is_published = true
      and (
        (p_book_id is not null and c.book_id = p_book_id)
        or (p_subject_id is not null and c.subject_id = p_subject_id)
        or (p_grade_id is not null and c.grade_id = p_grade_id)
        or (p_school_id is not null and c.school_id = p_school_id)
      )
    order by random()
    limit p_limit;
  end if;
end;
$function$;
