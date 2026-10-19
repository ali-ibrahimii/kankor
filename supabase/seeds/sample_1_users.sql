-- Sample Users, Schools, and School Members Seed
--
-- This script creates:
-- - 10 students (student1@mail.com - student10@mail.com)
-- - 5 instructors (instructor1@mail.com - instructor5@mail.com)
-- - 5 schools (School 1 - School 5)
-- - 10 school members with different roles mapped to schools
--
-- The password for all users is "TestTest1"
-- To run this manually:
--   pnpm supabase db execute -f supabase/seeds/sample_users.sql

DO $$
DECLARE
  v_user_id uuid;
  v_admin_id uuid := gen_random_uuid();
  v_school_id uuid;
  v_province_id uuid;
  i int;
  r record;
BEGIN
  -- Get a valid province_id to reference for consistent profile/school data
  SELECT id INTO v_province_id FROM public.provinces order by random() LIMIT 1;

  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin1@mail.com';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'admin1@mail.com', crypt('TestTest1', gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'Admin 1', 'role', 'student', 'province_id', v_province_id),
      now(), now(), '', '', '', ''
    );
  END IF;

  UPDATE public.profiles SET role = 'admin'::public.user_role WHERE id = v_admin_id;

    
  -- 1. Create 10 Student Users
  FOR i IN 1..10 LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'student' || i || '@mail.com';
    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
        'student' || i || '@mail.com', crypt('TestTest1', gen_salt('bf')),
        now(), now(), '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Student ' || i, 'role', 'student', 'province_id', v_province_id),
        now(), now(), '', '', '', ''
      );
    END IF;
  END LOOP;

  -- 2. Create 5 Instructor Users
  FOR i IN 1..5 LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'instructor' || i || '@mail.com';
    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
        'instructor' || i || '@mail.com', crypt('TestTest1', gen_salt('bf')),
        now(), now(), '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Instructor ' || i, 'role', 'instructor', 'province_id', v_province_id),
        now(), now(), '', '', '', ''
      );
    END IF;

    -- Ensure instructor profiles have 'active' status
    UPDATE public.profiles
    SET instructor_status = 'active'::public.account_status, role = 'instructor'
    WHERE email = 'instructor' || i || '@mail.com';
  END LOOP;

  -- 3. Create Additional School Member Users
  -- We need 10 school members. Let's create:
  -- - 5 Owners (owner1@mail.com - owner5@mail.com)
  -- - 1 Admin (admin1@mail.com)
  -- - 1 Manager (manager1@mail.com)
  -- - 1 Staff (staff1@mail.com)
  -- - 1 Viewer (viewer1@mail.com)
  -- Together with instructor1@mail.com, this will give us 10 school members with different roles.
  
  -- Create Owners (owner1 to owner5)
  FOR i IN 1..5 LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'owner' || i || '@mail.com';
    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
        'owner' || i || '@mail.com', crypt('TestTest1', gen_salt('bf')),
        now(), now(), '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', 'Owner ' || i, 'role', 'instructor', 'province_id', v_province_id),
        now(), now(), '', '', '', ''
      );
    END IF;

    -- Ensure owner profiles have 'active' status
    UPDATE public.profiles
    SET instructor_status = 'active'::public.account_status, role = 'instructor'
    WHERE email = 'owner' || i || '@mail.com';
  END LOOP;

  -- Admin 1 is created as a super admin at the top of this script.

  -- Create Manager 1
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'manager1@mail.com';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'manager1@mail.com', crypt('TestTest1', gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'Manager 1', 'role', 'instructor', 'province_id', v_province_id),
      now(), now(), '', '', '', ''
    );
  END IF;
  UPDATE public.profiles
  SET instructor_status = 'active'::public.account_status, role = 'instructor'
  WHERE email = 'manager1@mail.com';

  -- Create Staff 1
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'staff1@mail.com';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'staff1@mail.com', crypt('TestTest1', gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'Staff 1', 'role', 'instructor', 'province_id', v_province_id),
      now(), now(), '', '', '', ''
    );
  END IF;
  UPDATE public.profiles
  SET instructor_status = 'active'::public.account_status, role = 'instructor'
  WHERE email = 'staff1@mail.com';

  -- Create Viewer 1
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'viewer1@mail.com';
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'viewer1@mail.com', crypt('TestTest1', gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'Viewer 1', 'role', 'instructor', 'province_id', v_province_id),
      now(), now(), '', '', '', ''
    );
  END IF;
  UPDATE public.profiles
  SET instructor_status = 'active'::public.account_status, role = 'instructor'
  WHERE email = 'viewer1@mail.com';

  -- 4. Create 5 Schools
  -- We link each school to its owner (owner1..owner5) via the user_id column
  FOR i IN 1..5 LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'owner' || i || '@mail.com';
    SELECT id INTO v_school_id FROM public.schools WHERE name = 'School ' || i;
    IF v_school_id IS NULL THEN
      INSERT INTO public.schools (
        name, address, admin_email, user_id, status, province_id
      ) VALUES (
        'School ' || i,
        'Address of School ' || i,
        'school' || i || '@mail.com',
        v_user_id,
        'active'::public.account_status,
        v_province_id
      );
    END IF;
  END LOOP;

  -- 5. Add 10 School Members with Different Roles
  -- We associate the 10 created/assigned staff users as members of the schools.
  FOR r IN (
    SELECT s.id as school_id, p.id as user_id, m.role
    FROM (
      VALUES 
        ('School 1', 'owner1@mail.com', 'owner'::public.school_member_role),
        ('School 1', 'admin1@mail.com', 'admin'::public.school_member_role),
        ('School 2', 'owner2@mail.com', 'owner'::public.school_member_role),
        ('School 2', 'instructor1@mail.com', 'instructor'::public.school_member_role),
        ('School 3', 'owner3@mail.com', 'owner'::public.school_member_role),
        ('School 3', 'manager1@mail.com', 'manager'::public.school_member_role),
        ('School 4', 'owner4@mail.com', 'owner'::public.school_member_role),
        ('School 4', 'staff1@mail.com', 'staff'::public.school_member_role),
        ('School 5', 'owner5@mail.com', 'owner'::public.school_member_role),
        ('School 5', 'viewer1@mail.com', 'viewer'::public.school_member_role)
    ) AS m(school_name, email, role)
    JOIN public.schools s ON s.name = m.school_name
    JOIN public.profiles p ON p.email = m.email
  ) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.school_members 
      WHERE school_id = r.school_id AND user_id = r.user_id
    ) THEN
      INSERT INTO public.school_members (school_id, user_id, role)
      VALUES (r.school_id, r.user_id, r.role);
    END IF;
  END LOOP;

END $$;
