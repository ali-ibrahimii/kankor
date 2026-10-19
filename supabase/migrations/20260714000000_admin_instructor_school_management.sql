-- ─────────────────────────────────────────────────────────────────────────
-- Admin instructor & school management
--
-- 1. Extends account_status with 'suspended' and 'disabled' so admins can
--    temporarily suspend or permanently disable instructor/school accounts
--    (previously only pending/active/rejected existed).
-- 2. Admin RLS policies on schools — schools previously had no admin
--    update/delete policy at all ("schools owner can update" only checks
--    ownership), so /d/admin/schools couldn't manage school status.
-- 3. Flattened, security-invoker admin list views (instructors, schools,
--    school members) with per-row content counts, so the generic
--    useQueryFilters hook can search/filter/sort/paginate them via
--    PostgREST like any table. RLS of the underlying tables still applies
--    (admins see everything, others see only what base policies allow).
-- 4. get_admin_instructor_overview() — aggregate metrics for the admin
--    instructor detail page (cross-row aggregates over other users'
--    enrollment/purchase rows, hence SECURITY DEFINER + is_admin check,
--    mirroring the get_*_dashboard_overview convention).
-- 5. get_school_dashboard_overview() now also allows platform admins, so
--    the admin school detail page can reuse it for its metrics.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Account status values ---------------------------------------------------
-- NOTE: new enum values may not be *used* in this same migration
-- (PostgreSQL restriction) — they are only referenced from app code.
alter type public.account_status add value if not exists 'suspended';
alter type public.account_status add value if not exists 'disabled';

-- 2. Admin policies on schools ----------------------------------------------
create policy "Admins can update any school"
	on "public"."schools"
	as permissive
	for update
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

create policy "Admins can delete any school"
	on "public"."schools"
	as permissive
	for delete
	to authenticated
	using (public.is_admin());

-- 3. Admin list views ---------------------------------------------------------

-- Instructors: one row per instructor profile with content counts.
-- security_invoker so profiles/courses/decks/quizzes RLS applies to the
-- caller — admins (per their RLS policies) see all rows and full counts.
create or replace view public.admin_instructors_view
with (security_invoker = on) as
select
	p.id,
	p.full_name,
	p.email,
	p.phone,
	p.avatar_url,
	p.bio,
	p.slug,
	p.website_url,
	p.instructor_status,
	p.province_id,
	pr.name as province_name,
	p.created_at,
	p.updated_at,
	(
		select count(*)
		from public.courses c
		where c.instructor_id = p.id
	) as courses_count,
	(
		select count(*)
		from public.courses c
		where c.instructor_id = p.id and c.is_published
	) as published_courses_count,
	(
		select count(*)
		from public.decks d
		where d.user_id = p.id
	) as decks_count,
	(
		select count(*)
		from public.quizzes q
		where q.user_id = p.id
	) as quizzes_count
from public.profiles p
left join public.provinces pr on pr.id = p.province_id
where p.role = 'instructor';

-- Schools: one row per school with owner info and content counts.
create or replace view public.admin_schools_view
with (security_invoker = on) as
select
	s.id,
	s.name,
	s.status,
	s.admin_email,
	s.address,
	s.user_id as owner_id,
	op.full_name as owner_name,
	op.email as owner_email,
	s.created_at,
	s.updated_at,
	(
		select count(*)
		from public.school_members sm
		where sm.school_id = s.id
	) as members_count,
	(
		select count(*)
		from public.courses c
		where c.school_id = s.id
	) as courses_count,
	(
		select count(*)
		from public.decks d
		where d.school_id = s.id
	) as decks_count,
	(
		select count(*)
		from public.quizzes q
		where q.school_id = s.id
	) as quizzes_count
from public.schools s
left join public.profiles op on op.id = s.user_id;

-- School members flattened with member profile info, so the members tab can
-- search by name/email through PostgREST `or=` filters (joined columns are
-- not searchable that way).
create or replace view public.admin_school_members_view
with (security_invoker = on) as
select
	sm.id,
	sm.school_id,
	sm.user_id,
	sm.role,
	sm.created_at,
	sm.updated_at,
	p.full_name,
	p.email,
	p.phone,
	p.avatar_url
from public.school_members sm
join public.profiles p on p.id = sm.user_id;

grant select on public.admin_instructors_view to authenticated;
grant select on public.admin_schools_view to authenticated;
grant select on public.admin_school_members_view to authenticated;

-- 4. Admin instructor overview -------------------------------------------------
create or replace function public.get_admin_instructor_overview(
	p_instructor_id uuid
)
returns table (
	published_courses_count bigint,
	draft_courses_count bigint,
	total_students_count bigint,
	total_decks_count bigint,
	total_quizzes_count bigint,
	total_earnings_credits bigint,
	earnings_this_month_credits bigint,
	average_rating numeric,
	recent_enrollments jsonb
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
		raise exception 'Admin access required.';
	end if;

	return query
	select
		(select count(*) from public.courses c where c.instructor_id = p_instructor_id and c.is_published),
		(select count(*) from public.courses c where c.instructor_id = p_instructor_id and not c.is_published),
		(
			select count(distinct e.user_id)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			where c.instructor_id = p_instructor_id
		),
		(select count(*) from public.decks d where d.user_id = p_instructor_id),
		(select count(*) from public.quizzes q where q.user_id = p_instructor_id),
		(select coalesce(sum(p.price_credits), 0) from public.purchases p where p.seller_profile_id = p_instructor_id),
		(
			select coalesce(sum(p.price_credits), 0)
			from public.purchases p
			where p.seller_profile_id = p_instructor_id
				and p.created_at >= date_trunc('month', now())
		),
		(
			select coalesce(round(avg(r.rating), 2), 0)
			from public.reviews r
			join public.courses c on c.id = r.course_id
			where c.instructor_id = p_instructor_id
		),
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
				where c.instructor_id = p_instructor_id
				order by e.enrolled_at desc
				limit 5
			) t
		);
end;
$function$;

grant execute on function public.get_admin_instructor_overview(uuid) to authenticated;

-- 5. Allow platform admins to read any school's dashboard overview -------------
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

	-- Platform admins may inspect any school; everyone else must be a member.
	if not (public.is_admin(v_uid) or public.is_school_member(p_school_id, v_uid)) then
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
