-- ─────────────────────────────────────────────────────────────────────────
-- Admin courses/quizzes/decks management
--
-- 1. courses' own UPDATE policy already lets admins manage any course
--    (can_manage_course = is_course_instructor OR is_admin() OR
--    is_school_editor, added in 20260709120000_courses_update_policy.sql).
--    modules and lesson_content_blocks were already brought onto
--    can_manage_course()/can_view_course() by a later, unnumbered pass
--    over review_db_rls.sql (verified against the live policy catalog).
--    lessons was missed: its SELECT/INSERT/UPDATE/DELETE policies still
--    call is_course_instructor_old(uid, course_id) with no admin bypass,
--    so an admin opening the shared CourseBuilder on someone else's
--    course could load its modules and content blocks but not the
--    lessons in between. This brings `lessons` to parity with its two
--    sibling tables.
-- 2. Flattened, security-invoker admin list views for courses/quizzes/
--    decks, mirroring admin_instructors_view/admin_schools_view
--    (20260714000000_admin_instructor_school_management.sql) — joined
--    owner/instructor name + per-row counts so useQueryFilters/PostgREST
--    can search and filter through joined columns instead of N+1 queries.
--    RLS of the underlying tables still applies (security_invoker); admins
--    see everything per their existing policies, others see only what
--    base policies allow.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. lessons RLS ---------------------------------------------------------

drop policy "Instructor can create a course lesson" on "public"."lessons";
drop policy "Instructor can delete a course lesson" on "public"."lessons";
drop policy "Instructor can read a course lesson" on "public"."lessons";
drop policy "Instructor can update a course lesson" on "public"."lessons";

create policy "Instructor, admin, and school editor can create a course lesson"
  on "public"."lessons"
  as permissive
  for insert
  to authenticated
with check (public.can_manage_course(course_id));

create policy "Instructor, admin, and school editor can delete a course lesson"
  on "public"."lessons"
  as permissive
  for delete
  to authenticated
using (public.can_manage_course(course_id));

create policy "Instructor, admin, and school member can read a course lesson"
  on "public"."lessons"
  as permissive
  for select
  to authenticated
using (public.can_view_course(course_id));

create policy "Instructor, admin, and school editor can update a course lesson"
  on "public"."lessons"
  as permissive
  for update
  to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

-- 2. Admin list views ---------------------------------------------------------

create or replace view public.admin_courses_view
with (security_invoker = on) as
select
	c.id,
	c.title,
	c.slug,
	c.subtitle,
	c.description,
	c.instructor_id,
	c.level,
	c.cover_image_url,
	c.promo_video_url,
	c.is_published,
	c.published_at,
	c.is_free,
	c.price,
	c.currency,
	c.price_credits,
	c.enrollment_limit,
	c.estimated_duration_hours,
	c.book_id,
	c.subject_id,
	c.grade_id,
	c.school_id,
	c.visibility,
	c.language,
	c.seo_title,
	c.seo_description,
	c.created_at,
	c.updated_at,
	p.full_name as instructor_name,
	p.avatar_url as instructor_avatar_url,
	p.email as instructor_email,
	subj.name as subject_name,
	gr.name as grade_name,
	b.full_name as book_name,
	(
		select count(*)
		from public.modules m
		where m.course_id = c.id
	) as modules_count,
	(
		select count(*)
		from public.lessons l
		where l.course_id = c.id
	) as lessons_count,
	(
		select count(*)
		from public.enrollments e
		where e.course_id = c.id
	) as enrollments_count,
	(
		select coalesce(round(avg(r.rating), 2), 0)
		from public.reviews r
		where r.course_id = c.id
	) as avg_rating
from public.courses c
left join public.profiles p on p.id = c.instructor_id
left join public.subjects subj on subj.id = c.subject_id
left join public.grades gr on gr.id = c.grade_id
left join public.books b on b.id = c.book_id;

create or replace view public.admin_quizzes_view
with (security_invoker = on) as
select
	q.id,
	q.title,
	q.description,
	q.time_limit_minutes,
	q.passing_score_percentage,
	q.max_attempts,
	q.shuffle_questions,
	q.show_correct_answers_after,
	q.instructions,
	q.school_id,
	q.entrance_code,
	q.lesson_id,
	q.slug,
	q.user_id,
	q.visibility,
	q.is_free,
	q.price_credits,
	q.seo_title,
	q.seo_description,
	q.created_at,
	q.updated_at,
	l.title as lesson_title,
	l.course_id as course_id,
	crs.title as course_title,
	sch.name as school_name,
	p.full_name as owner_name,
	p.email as owner_email,
	(
		select count(*)
		from public.questions qn
		where qn.quiz_id = q.id
	) as question_count
from public.quizzes q
left join public.lessons l on l.id = q.lesson_id
left join public.courses crs on crs.id = l.course_id
left join public.schools sch on sch.id = q.school_id
left join public.profiles p on p.id = q.user_id;

create or replace view public.admin_decks_view
with (security_invoker = on) as
select
	d.id,
	d.name,
	d.slug,
	d.description,
	d.creation,
	d.user_id,
	d.book_id,
	d.algorithm,
	d.visibility,
	d.is_free,
	d.price_credits,
	d.school_id,
	d.seo_title,
	d.seo_description,
	d.created_at,
	d.updated_at,
	p.full_name as owner_name,
	p.email as owner_email,
	sch.name as school_name,
	(
		select count(*)
		from public.flashcards f
		where f.deck_id = d.id
	) as card_count
from public.decks d
left join public.profiles p on p.id = d.user_id
left join public.schools sch on sch.id = d.school_id;

grant select on public.admin_courses_view to authenticated;
grant select on public.admin_quizzes_view to authenticated;
grant select on public.admin_decks_view to authenticated;
