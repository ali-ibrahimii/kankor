-- Add province_id column to schools table
ALTER TABLE "public"."schools" ADD COLUMN "province_id" uuid;

-- Add foreign key constraint referencing provinces(id)
ALTER TABLE "public"."schools" 
  ADD CONSTRAINT "schools_province_id_fkey" 
  FOREIGN KEY (province_id) 
  REFERENCES public.provinces(id) 
  ON DELETE SET NULL;

-- Update trigger function to also copy province_id from raw_user_meta_data to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role, locale, province_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'), 
    COALESCE(NEW.email, NULL),
    COALESCE(NEW.phone, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' IN ('instructor', 'student') THEN NEW.raw_user_meta_data->>'role'
      ELSE 'student'
    END::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'fa')::public.language_enum,
    (NEW.raw_user_meta_data->>'province_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;$function$
;
