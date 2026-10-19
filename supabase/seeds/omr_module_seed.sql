-- Sample data for the OMR (bubble-sheet) quiz module: one quiz, ~10 questions,
-- a roster of registered students, and a mix of printed/unprinted, scored/
-- unscored answer sheets. Fully self-contained (creates its own instructor
-- and student auth users) so the OMR dashboard and OMR service work can both
-- start against real data.
--
-- NOT wired into supabase/config.toml's db.seed.sql_paths (that only runs
-- initial_data.sql on `db reset`). Run manually against local Supabase with:
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2 | tr -d '\"')" \
--     -f supabase/seeds/omr_module_seed.sql
-- or simply: pnpm supabase db execute -f supabase/seeds/omr_module_seed.sql

do $$
declare
  v_instructor_id uuid := gen_random_uuid();
  v_student_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  v_quiz_id uuid;
  v_question_ids uuid[] := array[]::uuid[];
  v_question_id uuid;
  v_option_letters text[] := array['A', 'B', 'C', 'D'];
  i int;
  j int;
  v_variant record;
begin
  -- Instructor (independent, no school) ---------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_instructor_id, 'authenticated', 'authenticated',
    'omr.instructor@example.com', crypt('password123', gen_salt('bf')),
    now(), now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  );
  update public.profiles
    set role = 'instructor', full_name = 'OMR Sample Instructor'
    where id = v_instructor_id;

  -- Students --------------------------------------------------------------
  for i in 1..array_length(v_student_ids, 1) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_student_ids[i], 'authenticated', 'authenticated',
      'omr.student' || i || '@example.com', crypt('password123', gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    );
    update public.profiles
      set role = 'student', full_name = 'OMR Sample Student ' || i
      where id = v_student_ids[i];
  end loop;

  -- Quiz --------------------------------------------------------------
  insert into public.quizzes (title, description, user_id, registration_deadline)
  values (
    'Kankor Practice Test — Physics Unit 1',
    'Sample OMR bubble-sheet quiz seeded for dashboard/OMR-service development.',
    v_instructor_id,
    now() + interval '30 days'
  )
  returning id into v_quiz_id;

  -- 10 single-correct-answer multiple choice questions, 4 options each ----
  for i in 1..10 loop
    insert into public.questions (quiz_id, question_text, question_type, order_index, points)
    values (v_quiz_id, 'Sample question #' || i || ' — physics unit 1', 'multiple_choice_single_correct', i, 1)
    returning id into v_question_id;

    v_question_ids := v_question_ids || v_question_id;

    for j in 1..4 loop
      insert into public.question_options (question_id, quiz_id, option_text, is_correct, order_index)
      values (
        v_question_id, v_quiz_id,
        'Option ' || v_option_letters[j] || ' for question ' || i,
        j = 1, -- first option is the correct one for every sample question
        j - 1  -- order_index 0..3, matches OMR detected_option_index convention
      );
    end loop;
  end loop;

  -- Roster: 3 self-registered, 1 manually added by the instructor --------
  insert into public.quiz_registrations (quiz_id, student_id, source, registered_by) values
    (v_quiz_id, v_student_ids[1], 'self', v_student_ids[1]),
    (v_quiz_id, v_student_ids[2], 'self', v_student_ids[2]),
    (v_quiz_id, v_student_ids[3], 'self', v_student_ids[3]),
    (v_quiz_id, v_student_ids[4], 'owner', v_instructor_id);

  -- Print: generate one shuffled variant per registered student, locking the quiz
  perform public.generate_quiz_variants(v_quiz_id, true, v_instructor_id);

  -- Simulate one scored sheet and one pending upload -----------------------
  select * into v_variant
    from public.quiz_variants
    where quiz_id = v_quiz_id and student_id = v_student_ids[1];

  perform public.record_omr_scan_result(
    (public.create_omr_scan(v_variant.id, v_quiz_id::text || '/' || v_variant.id::text || '/scan-1.jpg', v_instructor_id)).id,
    (
      select jsonb_agg(jsonb_build_object(
        'question_id', q,
        'detected_option_index', 0,
        'confidence', 0.95
      ))
      from unnest(v_variant.question_order) as q
    ),
    '{"engine": "sample-seed", "note": "synthetic perfect score for seed data"}'::jsonb
  );

  select * into v_variant
    from public.quiz_variants
    where quiz_id = v_quiz_id and student_id = v_student_ids[2];

  perform public.create_omr_scan(v_variant.id, v_quiz_id::text || '/' || v_variant.id::text || '/scan-1.jpg', v_instructor_id);

  raise notice 'Seeded OMR quiz % with % registrations and % variants', v_quiz_id,
    (select count(*) from public.quiz_registrations where quiz_id = v_quiz_id),
    (select count(*) from public.quiz_variants where quiz_id = v_quiz_id);
end $$;
