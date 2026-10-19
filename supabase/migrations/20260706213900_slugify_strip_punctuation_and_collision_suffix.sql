-- slugify() previously only collapsed whitespace, leaving punctuation (most
-- notably parentheses, common in titles like "ریاضی (صنف دهم)") in the slug.
-- Parenthesized slugs need heavy percent-encoding in URLs, and combined with
-- an unrelated Next.js ISR quirk (dynamic `[slug]` params intermittently
-- arriving still percent-encoded instead of decoded — confirmed by direct
-- server-side logging), affected detail pages 404 unpredictably. Stripping
-- punctuation keeps slugs simpler and reduces exposure to that whole class
-- of URL-encoding edge cases. `[:alnum:]` is UTF8-aware here (verified
-- directly against Persian text), so non-Latin letters are preserved.
CREATE OR REPLACE FUNCTION public.slugify(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN trim(
    both '-' from
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(input_text)), '\s+', '-', 'g'),
        '[^[:alnum:]-]', '', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$function$
;

-- Stripping punctuation increases the odds of two different titles
-- slugifying to the same base slug (e.g. two titles that only differed by
-- punctuation). generate_slug() now retries with a random numeric suffix
-- until it finds a free slug within the same table, instead of relying on
-- the unique index to reject the insert outright.
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
