-- ─────────────────────────────────────────────────────────────────────────
-- Dashboard overview RPCs — one aggregate-fetching function per role,
-- mirroring the get_*_details() convention (STABLE SECURITY DEFINER,
-- explicit search_path, single TABLE row with jsonb sub-columns for lists
-- and trend series). RLS scopes per-row reads correctly, but none of these
-- dashboards can be expressed as a single-row RLS-scoped select — an
-- instructor's "total students across my courses" is a cross-row aggregate
-- over other users' enrollment rows, so each function re-checks the
-- caller's role/ownership internally instead of relying on RLS.
-- ─────────────────────────────────────────────────────────────────────────

-- Student overview ----------------------------------------------------------
-- "cards_due_today" mirrors the existing client-side due-count query in
-- spaced-repitation/queries.ts (next_review_date <= end of today).
-- "study_activity" approximates a 14-day activity trend from
-- deck_cards.last_reviewed_at — there is no separate per-review log table,
-- so this counts distinct cards last-touched per day rather than raw
-- review events.
create or replace function public.get_student_dashboard_overview()
returns table (
  enrolled_courses_count bigint,
  active_decks_count bigint,
  cards_due_today bigint,
  tests_completed_count bigint,
  tests_passed_count bigint,
  bookmarks_count bigint,
  notes_count bigint,
  credit_balance integer,
  continue_learning jsonb,
  recent_quiz_attempts jsonb,
  recent_notes jsonb,
  study_activity jsonb
)
language plpgsql
stable security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  return query
  select
    (select count(*) from public.enrollments e where e.user_id = v_uid and e.course_id is not null),
    (select count(*) from public.enrollments e where e.user_id = v_uid and e.deck_id is not null),
    (select count(*) from public.deck_cards dc where dc.user_id = v_uid and dc.next_review_date < (current_date + interval '1 day')),
    (select count(*) from public.quiz_attempts qa where qa.user_id = v_uid and qa.completed_at is not null),
    (select count(*) from public.quiz_attempts qa where qa.user_id = v_uid and qa.passed = true),
    (select count(*) from public.bookmarks b where b.user_id = v_uid),
    (select count(*) from public.notes n where n.user_id = v_uid),
    (select coalesce(p.credit_balance, 0) from public.profiles p where p.id = v_uid),
    (
      select jsonb_build_object(
        'course_id', c.id,
        'course_title', c.title,
        'course_slug', c.slug,
        'progress_percentage', e.progress_percentage,
        'last_accessed_lesson_id', e.last_accessed_lesson_id
      )
      from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.user_id = v_uid and e.completed_at is null
      order by e.enrolled_at desc
      limit 1
    ),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', qa.id,
          'quiz_title', q.title,
          'score', qa.score,
          'max_score_possible', qa.max_score_possible,
          'passed', qa.passed,
          'completed_at', qa.completed_at
        ) as row
        from public.quiz_attempts qa
        join public.quizzes q on q.id = qa.quiz_id
        where qa.user_id = v_uid and qa.completed_at is not null
        order by qa.completed_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', n.id,
          'title', n.title,
          'created_at', n.created_at
        ) as row
        from public.notes n
        where n.user_id = v_uid
        order by n.created_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'count', coalesce(r.cnt, 0)) order by d), '[]'::jsonb)
      from generate_series((current_date - interval '13 days'), current_date, interval '1 day') d
      left join (
        select dc.last_reviewed_at::date as day, count(*) as cnt
        from public.deck_cards dc
        where dc.user_id = v_uid
          and dc.last_reviewed_at >= current_date - interval '13 days'
        group by dc.last_reviewed_at::date
      ) r on r.day = d::date
    );
end;
$function$;

grant execute on function public.get_student_dashboard_overview() to authenticated;

-- Instructor overview ---------------------------------------------------------
create or replace function public.get_instructor_dashboard_overview()
returns table (
  published_courses_count bigint,
  draft_courses_count bigint,
  total_students_count bigint,
  total_decks_count bigint,
  total_quizzes_count bigint,
  average_rating numeric,
  total_earnings_credits bigint,
  earnings_this_month_credits bigint,
  recent_enrollments jsonb,
  recent_quiz_attempts jsonb,
  earnings_trend jsonb
)
language plpgsql
stable security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_user_a('instructor', v_uid) then
    raise exception 'Only instructors can view this dashboard.';
  end if;

  return query
  select
    (select count(*) from public.courses c where c.instructor_id = v_uid and c.is_published = true),
    (select count(*) from public.courses c where c.instructor_id = v_uid and c.is_published = false),
    (select count(distinct e.user_id) from public.enrollments e join public.courses c on c.id = e.course_id where c.instructor_id = v_uid),
    (select count(*) from public.decks d where d.user_id = v_uid),
    (select count(*) from public.quizzes q where q.user_id = v_uid),
    (select round(avg(r.rating)::numeric, 1) from public.reviews r join public.courses c on c.id = r.course_id where c.instructor_id = v_uid),
    (select coalesce(sum(p.price_credits), 0) from public.purchases p where p.seller_profile_id = v_uid),
    (select coalesce(sum(p.price_credits), 0) from public.purchases p where p.seller_profile_id = v_uid and p.created_at >= date_trunc('month', now())),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', e.id,
          'student_name', pr.full_name,
          'course_title', c.title,
          'enrolled_at', e.enrolled_at
        ) as row
        from public.enrollments e
        join public.courses c on c.id = e.course_id
        join public.profiles pr on pr.id = e.user_id
        where c.instructor_id = v_uid
        order by e.enrolled_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', qa.id,
          'student_name', pr.full_name,
          'quiz_title', q.title,
          'score', qa.score,
          'max_score_possible', qa.max_score_possible,
          'passed', qa.passed,
          'completed_at', qa.completed_at
        ) as row
        from public.quiz_attempts qa
        join public.quizzes q on q.id = qa.quiz_id
        join public.profiles pr on pr.id = qa.user_id
        where q.user_id = v_uid and qa.completed_at is not null
        order by qa.completed_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'credits', coalesce(s.sum_credits, 0)) order by d), '[]'::jsonb)
      from generate_series((current_date - interval '13 days'), current_date, interval '1 day') d
      left join (
        select p.created_at::date as day, sum(p.price_credits) as sum_credits
        from public.purchases p
        where p.seller_profile_id = v_uid
          and p.created_at >= current_date - interval '13 days'
        group by p.created_at::date
      ) s on s.day = d::date
    );
end;
$function$;

grant execute on function public.get_instructor_dashboard_overview() to authenticated;

-- School overview -----------------------------------------------------------
-- "Students" of a school are read from profiles.school_id (their primary
-- school), not school_members — that table only holds staff-side roles
-- (owner/admin/instructor/manager/staff/viewer), never a 'student' row.
create or replace function public.get_school_dashboard_overview(p_school_id uuid)
returns table (
  students_count bigint,
  teachers_count bigint,
  staff_count bigint,
  courses_count bigint,
  decks_count bigint,
  quizzes_count bigint,
  total_earnings_credits bigint,
  earnings_this_month_credits bigint,
  recent_members jsonb,
  recent_quiz_attempts jsonb,
  earnings_trend jsonb
)
language plpgsql
stable security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_school_member(p_school_id, v_uid) then
    raise exception 'You are not a member of this school.';
  end if;

  return query
  select
    (select count(*) from public.profiles p where p.school_id = p_school_id and p.role = 'student'),
    (select count(*) from public.school_members sm where sm.school_id = p_school_id and sm.role = 'instructor'),
    (select count(*) from public.school_members sm where sm.school_id = p_school_id and sm.role <> 'instructor'),
    (select count(*) from public.courses c where c.school_id = p_school_id),
    (select count(*) from public.decks d where d.school_id = p_school_id),
    (select count(*) from public.quizzes q where q.school_id = p_school_id),
    (select coalesce(sum(p.price_credits), 0) from public.purchases p where p.seller_school_id = p_school_id),
    (select coalesce(sum(p.price_credits), 0) from public.purchases p where p.seller_school_id = p_school_id and p.created_at >= date_trunc('month', now())),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', sm.id,
          'full_name', pr.full_name,
          'role', sm.role,
          'joined_at', sm.created_at
        ) as row
        from public.school_members sm
        join public.profiles pr on pr.id = sm.user_id
        where sm.school_id = p_school_id
        order by sm.created_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', qa.id,
          'student_name', pr.full_name,
          'quiz_title', q.title,
          'score', qa.score,
          'max_score_possible', qa.max_score_possible,
          'passed', qa.passed,
          'completed_at', qa.completed_at
        ) as row
        from public.quiz_attempts qa
        join public.quizzes q on q.id = qa.quiz_id
        join public.profiles pr on pr.id = qa.user_id
        where q.school_id = p_school_id and qa.completed_at is not null
        order by qa.completed_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'credits', coalesce(s.sum_credits, 0)) order by d), '[]'::jsonb)
      from generate_series((current_date - interval '13 days'), current_date, interval '1 day') d
      left join (
        select p.created_at::date as day, sum(p.price_credits) as sum_credits
        from public.purchases p
        where p.seller_school_id = p_school_id
          and p.created_at >= current_date - interval '13 days'
        group by p.created_at::date
      ) s on s.day = d::date
    );
end;
$function$;

grant execute on function public.get_school_dashboard_overview(uuid) to authenticated;

-- Platform admin overview -----------------------------------------------------
create or replace function public.get_platform_admin_overview()
returns table (
  students_count bigint,
  instructors_count bigint,
  schools_active_count bigint,
  schools_pending_count bigint,
  pending_instructor_approvals bigint,
  courses_published_count bigint,
  courses_draft_count bigint,
  decks_count bigint,
  quizzes_count bigint,
  total_revenue_credits bigint,
  revenue_this_month_credits bigint,
  recent_signups jsonb,
  revenue_trend jsonb,
  signup_trend jsonb
)
language plpgsql
stable security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_admin(v_uid) then
    raise exception 'Only platform admins can view this dashboard.';
  end if;

  return query
  select
    (select count(*) from public.profiles p where p.role = 'student'),
    (select count(*) from public.profiles p where p.role = 'instructor'),
    (select count(*) from public.schools s where s.status = 'active'),
    (select count(*) from public.schools s where s.status = 'pending'),
    (select count(*) from public.profiles p where p.role = 'instructor' and p.instructor_status = 'pending'),
    (select count(*) from public.courses c where c.is_published = true),
    (select count(*) from public.courses c where c.is_published = false),
    (select count(*) from public.decks),
    (select count(*) from public.quizzes),
    (select coalesce(sum(price_credits), 0) from public.purchases),
    (select coalesce(sum(price_credits), 0) from public.purchases where created_at >= date_trunc('month', now())),
    (
      select coalesce(jsonb_agg(row), '[]'::jsonb) from (
        select jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'role', p.role,
          'created_at', p.created_at
        ) as row
        from public.profiles p
        order by p.created_at desc
        limit 5
      ) t
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'credits', coalesce(s.sum_credits, 0)) order by d), '[]'::jsonb)
      from generate_series((current_date - interval '13 days'), current_date, interval '1 day') d
      left join (
        select p.created_at::date as day, sum(p.price_credits) as sum_credits
        from public.purchases p
        where p.created_at >= current_date - interval '13 days'
        group by p.created_at::date
      ) s on s.day = d::date
    ),
    (
      select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'count', coalesce(s.cnt, 0)) order by d), '[]'::jsonb)
      from generate_series((current_date - interval '13 days'), current_date, interval '1 day') d
      left join (
        select p.created_at::date as day, count(*) as cnt
        from public.profiles p
        where p.created_at >= current_date - interval '13 days'
        group by p.created_at::date
      ) s on s.day = d::date
    );
end;
$function$;

grant execute on function public.get_platform_admin_overview() to authenticated;
