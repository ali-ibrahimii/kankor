alter table "public"."profiles" add column "locale" public.language_enum not null default 'fa'::public.language_enum;


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'), 
    COALESCE(NEW.email, NULL),
    COALESCE(NEW.phone, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'fa')::public.language_enum
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;$function$
;
  
  
  drop policy "Admins can delete any profile" on "public"."profiles";

  create policy "Admins can delete any profile"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using (public.is_admin());


drop policy "Admins can insert any profile" on "public"."profiles";

  create policy "Admins can insert any profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());


drop policy "Admins can select all profiles" on "public"."profiles";

  create policy "Admins can select all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (public.is_admin());


drop policy "Admins can update any profile" on "public"."profiles";

  create policy "Admins can update any profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



drop policy "Allow users to insert their own profile" on "public"."profiles";

  create policy "Allow users to insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((public.is_owner(id) AND (role <> 'admin'::public.user_role)));


drop policy "Allow users to update their own profile" on "public"."profiles";

  create policy "Allow users to update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (public.is_owner(id))
with check ((public.is_owner(id) AND (role = ( SELECT p.role
   FROM public.profiles p
  WHERE (p.id = auth.uid())))));
