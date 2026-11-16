-- ─────────────────────────────────────────────────────────────────────────
-- School signup provisioning moves into the database
--
-- The signup server action created the `schools` row through the service-role
-- client. When SUPABASE_SERVICE_ROLE_KEY is missing or holds the anon key
-- (the most common misconfiguration), that insert fails with 42501
-- ("permission denied for table schools" — INSERT was revoked from `anon` in
-- 20260702151515) and the school signup dies with a generic permission error.
-- The auth user is still created, so retrying then hits "user already exists"
-- and the person can never reach their school dashboard.
--
-- This migration makes the DATABASE provision the school at signup time:
-- handle_new_user_profile_creation() (SECURITY DEFINER, already responsible
-- for the profiles row) now also inserts the `schools` row when the auth
-- metadata carries signup_type = 'school'. The existing on_schools_created
-- trigger then adds the owner row to school_members, so the whole signup is
-- a single transaction owned by the trigger chain — no app-side privileges
-- required. The server action keeps a service-role "repair" insert as a
-- second path for rows the trigger can't see.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user_profile_creation()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_role public.user_role;
begin
  v_role := case
    when new.raw_user_meta_data->>'role' in ('instructor', 'student')
      then (new.raw_user_meta_data->>'role')::public.user_role
    else 'student'::public.user_role
  end;

  insert into public.profiles (
    id, full_name, email, phone, avatar_url, role, locale, province_id,
    instructor_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown'),
    coalesce(new.email, null),
    coalesce(new.phone, null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    v_role,
    coalesce(new.raw_user_meta_data->>'locale', 'fa')::public.language_enum,
    (new.raw_user_meta_data->>'province_id')::uuid,
    -- Instructors are gated until an admin approves them; students are not.
    case
      when v_role = 'instructor'::public.user_role
        then 'pending'::public.account_status
      else null
    end
  )
  on conflict (id) do nothing;

  -- School signups also provision the school here (definer rights), so this
  -- no longer depends on the app holding a working service-role key. The
  -- on_schools_created trigger creates the owner membership afterwards.
  -- status keeps its 'pending' default: schools are approved by an admin.
  if new.raw_user_meta_data->>'signup_type' = 'school'
    and not exists (select 1 from public.schools s where s.user_id = new.id)
  then
    insert into public.schools (name, address, user_id, admin_email, province_id)
    values (
      new.raw_user_meta_data->>'school_name',
      new.raw_user_meta_data->>'school_address',
      new.id,
      new.email,
      nullif(new.raw_user_meta_data->>'province_id', '')::uuid
    );
  end if;

  return new;
end;
$function$;
