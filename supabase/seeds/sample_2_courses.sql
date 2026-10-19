-- Sample Courses, Classrooms, Members, and Resources Seed
--
-- This script creates:
-- - 5 courses (some independent, some school-affiliated)
-- - 5 classrooms (owned by various instructors/owners)
-- - Classroom memberships (enrolling students and assistants)
-- - Classroom resources (sharing courses to classrooms)
--
-- To run this manually:
--   pnpm supabase db execute -f supabase/seeds/sample_courses.sql

DO $$
DECLARE
  v_instructor_id uuid;
  v_school_id uuid;
  v_subject_id uuid;
  v_grade_id uuid;
  v_course_id uuid;
  v_classroom_id uuid;
  v_user_id uuid;
  r record;
BEGIN
  -- Retrieve dynamic references for subject and grade from existing seeded data
  SELECT id INTO v_subject_id FROM public.subjects LIMIT 1;
  SELECT id INTO v_grade_id FROM public.grades LIMIT 1;

  -- ---------------------------------------------------------------------------
  -- 1. Create Courses
  -- ---------------------------------------------------------------------------

  -- Course 1: Introduction to Algebra (Independent, owned by instructor1)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor1@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Introduction to Algebra') THEN
    INSERT INTO public.courses (
      title, subtitle, description, instructor_id, school_id, level, is_published, published_at, is_free, subject_id, grade_id, visibility, language
    ) VALUES (
      'Introduction to Algebra',
      'Fundamentals of algebraic expressions and equations',
      'This course covers equations, inequalities, graphs, and functions. Great for high school students preparing for exams.',
      v_instructor_id,
      NULL,
      'beginner'::public.course_level,
      true,
      now(),
      true,
      v_subject_id,
      v_grade_id,
      'public'::public.visibility,
      'fa'::public.language_enum
    );
  END IF;

  -- Course 2: Advanced Physics: Electromagnetism (Independent, owned by instructor2)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor2@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Advanced Physics: Electromagnetism') THEN
    INSERT INTO public.courses (
      title, subtitle, description, instructor_id, school_id, level, is_published, published_at, is_free, subject_id, grade_id, visibility, language
    ) VALUES (
      'Advanced Physics: Electromagnetism',
      'Dive deep into electric fields, magnetism, and Maxwell''s equations',
      'This course explores electric charges, electric potential, currents, magnetic induction, and basic electromagnetic waves.',
      v_instructor_id,
      NULL,
      'advanced'::public.course_level,
      true,
      now(),
      true,
      v_subject_id,
      v_grade_id,
      'public'::public.visibility,
      'en'::public.language_enum
    );
  END IF;

  -- Course 3: School 1: General Chemistry (Affiliated with School 1, owned by owner1)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'owner1@mail.com';
  SELECT id INTO v_school_id FROM public.schools WHERE name = 'School 1';
  IF v_instructor_id IS NOT NULL AND v_school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'School 1: General Chemistry') THEN
    INSERT INTO public.courses (
      title, subtitle, description, instructor_id, school_id, level, is_published, published_at, is_free, subject_id, grade_id, visibility, language
    ) VALUES (
      'School 1: General Chemistry',
      'Curriculum-aligned General Chemistry for School 1',
      'Covers atoms, elements, bonding, reactions, stoichiometry, and properties of matter.',
      v_instructor_id,
      v_school_id,
      'intermediate'::public.course_level,
      true,
      now(),
      true,
      v_subject_id,
      v_grade_id,
      'public'::public.visibility,
      'fa'::public.language_enum
    );
  END IF;

  -- Course 4: School 2: Principles of Biology (Affiliated with School 2, owned by instructor1)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor1@mail.com';
  SELECT id INTO v_school_id FROM public.schools WHERE name = 'School 2';
  IF v_instructor_id IS NOT NULL AND v_school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'School 2: Principles of Biology') THEN
    INSERT INTO public.courses (
      title, subtitle, description, instructor_id, school_id, level, is_published, published_at, is_free, subject_id, grade_id, visibility, language
    ) VALUES (
      'School 2: Principles of Biology',
      'Comprehensive high-school level biology aligned with School 2 standards',
      'An introduction to cells, genetics, evolution, ecosystems, and human physiology.',
      v_instructor_id,
      v_school_id,
      'all_levels'::public.course_level,
      true,
      now(),
      true,
      v_subject_id,
      v_grade_id,
      'public'::public.visibility,
      'ps'::public.language_enum
    );
  END IF;

  -- Course 5: School 3: World History II (Affiliated with School 3, owned by owner3)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'owner3@mail.com';
  SELECT id INTO v_school_id FROM public.schools WHERE name = 'School 3';
  IF v_instructor_id IS NOT NULL AND v_school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'School 3: World History II') THEN
    INSERT INTO public.courses (
      title, subtitle, description, instructor_id, school_id, level, is_published, published_at, is_free, subject_id, grade_id, visibility, language
    ) VALUES (
      'School 3: World History II',
      'From the industrial revolution to modern global history',
      'Examines historical milestones, conflicts, revolutions, and globalization over the last two centuries.',
      v_instructor_id,
      v_school_id,
      'all_levels'::public.course_level,
      true,
      now(),
      true,
      v_subject_id,
      v_grade_id,
      'public'::public.visibility,
      'fa'::public.language_enum
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- 2. Create Classrooms
  -- ---------------------------------------------------------------------------

  -- Classroom 1 (Owned by instructor1)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor1@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classrooms WHERE name = 'Math Grade 10 - Algebra') THEN
    INSERT INTO public.classrooms (
      user_id, name, description, join_code
    ) VALUES (
      v_instructor_id,
      'Math Grade 10 - Algebra',
      'Algebra lessons, practice worksheets, and discussions for Grade 10',
      'MATH10'
    );
  END IF;

  -- Classroom 2 (Owned by instructor2)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor2@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classrooms WHERE name = 'Physics Grade 11 - Mechanics') THEN
    INSERT INTO public.classrooms (
      user_id, name, description, join_code
    ) VALUES (
      v_instructor_id,
      'Physics Grade 11 - Mechanics',
      'Mechanics, gravity, friction, and force problems for Grade 11 physics',
      'PHYS11'
    );
  END IF;

  -- Classroom 3 (Owned by owner1)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'owner1@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classrooms WHERE name = 'School 1 - Grade 10 Chemistry') THEN
    INSERT INTO public.classrooms (
      user_id, name, description, join_code
    ) VALUES (
      v_instructor_id,
      'School 1 - Grade 10 Chemistry',
      'Chemistry lessons, periodic table, molecular bonds studies',
      'SCH1CHEM'
    );
  END IF;

  -- Classroom 4 (Owned by instructor1)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor1@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classrooms WHERE name = 'School 2 - Biology Group') THEN
    INSERT INTO public.classrooms (
      user_id, name, description, join_code
    ) VALUES (
      v_instructor_id,
      'School 2 - Biology Group',
      'Biology study group, genetics and ecosystems slides',
      'SCH2BIO'
    );
  END IF;

  -- Classroom 5 (Owned by owner3)
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'owner3@mail.com';
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classrooms WHERE name = 'School 3 - History Club') THEN
    INSERT INTO public.classrooms (
      user_id, name, description, join_code
    ) VALUES (
      v_instructor_id,
      'School 3 - History Club',
      'Historical events discussions, primary sources reviews',
      'SCH3HIST'
    );
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3. Enroll Classroom Members
  -- ---------------------------------------------------------------------------

  -- Enroll students in Classroom 1 (student1..student3)
  SELECT id INTO v_classroom_id FROM public.classrooms WHERE name = 'Math Grade 10 - Algebra';
  IF v_classroom_id IS NOT NULL THEN
    FOR r IN (
      SELECT id FROM public.profiles WHERE email IN ('student1@mail.com', 'student2@mail.com', 'student3@mail.com')
    ) LOOP
      IF NOT EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = v_classroom_id AND user_id = r.id) THEN
        INSERT INTO public.classroom_members (classroom_id, user_id, role)
        VALUES (v_classroom_id, r.id, 'student'::public.classroom_role);
      END IF;
    END LOOP;
  END IF;

  -- Enroll students in Classroom 3 (student4..student5) and admin1 as assistant
  SELECT id INTO v_classroom_id FROM public.classrooms WHERE name = 'School 1 - Grade 10 Chemistry';
  IF v_classroom_id IS NOT NULL THEN
    FOR r IN (
      SELECT id FROM public.profiles WHERE email IN ('student4@mail.com', 'student5@mail.com')
    ) LOOP
      IF NOT EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = v_classroom_id AND user_id = r.id) THEN
        INSERT INTO public.classroom_members (classroom_id, user_id, role)
        VALUES (v_classroom_id, r.id, 'student'::public.classroom_role);
      END IF;
    END LOOP;

    -- Also enroll admin1@mail.com as assistant
    SELECT id INTO v_user_id FROM public.profiles WHERE email = 'admin1@mail.com';
    IF v_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = v_classroom_id AND user_id = v_user_id) THEN
      INSERT INTO public.classroom_members (classroom_id, user_id, role)
      VALUES (v_classroom_id, v_user_id, 'assistant'::public.classroom_role);
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4. Create Classroom Resources (Share Courses)
  -- ---------------------------------------------------------------------------

  -- Share Introduction to Algebra to Math classroom (MATH10)
  SELECT id INTO v_classroom_id FROM public.classrooms WHERE name = 'Math Grade 10 - Algebra';
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'Introduction to Algebra';
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'instructor1@mail.com';
  IF v_classroom_id IS NOT NULL AND v_course_id IS NOT NULL AND v_instructor_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.classroom_resources WHERE classroom_id = v_classroom_id AND resource_id = v_course_id AND resource_type = 'course'::public.shareable_type) THEN
      INSERT INTO public.classroom_resources (classroom_id, resource_type, resource_id, shared_by)
      VALUES (v_classroom_id, 'course'::public.shareable_type, v_course_id, v_instructor_id);
    END IF;
  END IF;

  -- Share School 1 Chemistry course to Chemistry classroom (SCH1CHEM)
  SELECT id INTO v_classroom_id FROM public.classrooms WHERE name = 'School 1 - Grade 10 Chemistry';
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'School 1: General Chemistry';
  SELECT id INTO v_instructor_id FROM public.profiles WHERE email = 'owner1@mail.com';
  IF v_classroom_id IS NOT NULL AND v_course_id IS NOT NULL AND v_instructor_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.classroom_resources WHERE classroom_id = v_classroom_id AND resource_id = v_course_id AND resource_type = 'course'::public.shareable_type) THEN
      INSERT INTO public.classroom_resources (classroom_id, resource_type, resource_id, shared_by)
      VALUES (v_classroom_id, 'course'::public.shareable_type, v_course_id, v_instructor_id);
    END IF;
  END IF;

END $$;
