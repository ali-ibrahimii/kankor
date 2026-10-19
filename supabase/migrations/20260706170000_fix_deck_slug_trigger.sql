-- generate_slug() unconditionally read NEW.title, but `decks` has no `title`
-- column (it uses `name`) — any deck insert without an explicit slug would
-- error. Branch on the table the trigger fired for.
CREATE OR REPLACE FUNCTION public.generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    IF TG_TABLE_NAME = 'decks' THEN
      NEW.slug := public.slugify(NEW.name);
    ELSE
      NEW.slug := public.slugify(NEW.title);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;
