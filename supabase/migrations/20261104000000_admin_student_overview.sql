-- ─────────────────────────────────────────────────────────────────────────
-- Admin student overview
--
-- 1. get_admin_student_overview(p_student_id) — one round-trip that returns
--    everything the admin needs about a single student: aggregate counters,
--    their course enrollments (with grade + subject), quiz attempts with
--    scores, decks, classrooms, certificates, and study activity.
--
--    It is SECURITY DEFINER because most of the underlying rows belong to
--    *other* users and the aggregates span tables that RLS does not expose
--    to a cross-student read (e.g. quiz_attempts of another student).
--    The is_admin() check inside the function is what gates access — the
--    same convention get_admin_instructor_overview() already uses.
--
-- 2. get_admin_students_overview() — a batch variant that returns the same
--    summary counters for *every* student, so the admin students list can
--    show enrollments/grades/average score per row without N+1 queries.
--
-- 3. An admin view over students that exposes the per-student counters as
--    columns, so the list page can sort and filter on them through the
--    generic useQueryFilters hook (URL-synced) like any other table.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── 1. Single-student overview ────────────────────────────────────────────
create or replace function public.get_admin_student_overview(
	p_student_id uuid
)
returns table (
	enrolled_courses_count bigint,
	completed_courses_count bigint,
	in_progress_courses_count bigint,
	active_decks_count bigint,
	quiz_attempts_count bigint,
	quizzes_passed_count bigint,
	quizzes_failed_count bigint,
	average_quiz_score numeric,
	best_quiz_score numeric,
	bookmarks_count bigint,
	notes_count bigint,
	certificates_count bigint,
	classrooms_count bigint,
	lessons_completed_count bigint,
	study_minutes_count bigint,
	distinct_grades_count bigint,
	distinct_subjects_count bigint,
	first_enrolled_at timestamptz,
	last_activity_at timestamptz,
	course_enrollments jsonb,
	quiz_attempts jsonb,
	deck_progress jsonb,
	classrooms jsonb,
	certificates jsonb,
	activity jsonb
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
		-- Aggregate counters ---------------------------------------------
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p_student_id and e.course_id is not null
		),
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p_student_id
				and e.course_id is not null
				and e.completed_at is not null
		),
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p_student_id
				and e.course_id is not null
				and e.completed_at is null
		),
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p_student_id and e.deck_id is not null
		),
		(
			select count(*)
			from public.quiz_attempts qa
			where qa.user_id = p_student_id and qa.completed_at is not null
		),
		(
			select count(*)
			from public.quiz_attempts qa
			where qa.user_id = p_student_id and qa.passed = true
		),
		(
			select count(*)
			from public.quiz_attempts qa
			where qa.user_id = p_student_id and qa.passed = false
		),
		(
			select coalesce(
				round(
					avg(
						case
							when qa.max_score_possible is not null
								and qa.max_score_possible > 0
								and qa.score is not null
							then (qa.score::numeric / qa.max_score_possible) * 100
						end
					),
					1
				),
				0
			)
			from public.quiz_attempts qa
			where qa.user_id = p_student_id and qa.completed_at is not null
		),
		(
			select coalesce(
				round(
					max(
						case
							when qa.max_score_possible is not null
								and qa.max_score_possible > 0
								and qa.score is not null
							then (qa.score::numeric / qa.max_score_possible) * 100
						end
					),
					1
				),
				0
			)
			from public.quiz_attempts qa
			where qa.user_id = p_student_id and qa.completed_at is not null
		),
		(select count(*) from public.bookmarks b where b.user_id = p_student_id),
		(select count(*) from public.notes n where n.user_id = p_student_id),
		(
			select count(*)
			from public.certificates c
			where c.user_id = p_student_id
		),
		(
			select count(*)
			from public.classroom_members cm
			where cm.user_id = p_student_id
		),
		(
			select count(*)
			from public.lesson_progress lp
			where lp.user_id = p_student_id and lp.is_completed = true
		),
		-- Total watch time: video progress in seconds → minutes.
		(
			select coalesce(
				round(sum(coalesce(lp.video_progress_seconds, 0))::numeric / 60),
				0
			)::bigint
			from public.lesson_progress lp
			where lp.user_id = p_student_id
		),
		(
			select count(distinct c.grade_id)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			where e.user_id = p_student_id and c.grade_id is not null
		),
		(
			select count(distinct c.subject_id)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			where e.user_id = p_student_id and c.subject_id is not null
		),
		(
			select min(e.enrolled_at)
			from public.enrollments e
			where e.user_id = p_student_id
		),
		(
			select max(x.ts)
			from (
				select e.enrolled_at as ts from public.enrollments e where e.user_id = p_student_id
				union all
				select e.updated_at from public.enrollments e where e.user_id = p_student_id
				union all
				select qa.created_at from public.quiz_attempts qa where qa.user_id = p_student_id
				union all
				select lp.last_accessed_at from public.lesson_progress lp where lp.user_id = p_student_id
				union all
				select n.updated_at from public.notes n where n.user_id = p_student_id
				union all
				select b.created_at from public.bookmarks b where b.user_id = p_student_id
			) x
			where x.ts is not null
		),

		-- Course enrollments, with the grade/subject of each course --------
		(
			select coalesce(jsonb_agg(row order by sort_key desc nulls last), '[]'::jsonb)
			from (
				select
					e.enrolled_at as sort_key,
					jsonb_build_object(
					'id', e.id,
					'course_id', e.course_id,
					'course_title', c.title,
					'course_slug', c.slug,
					'cover_image_url', c.cover_image_url,
					'grade_id', c.grade_id,
					'grade_name', g.name,
					'subject_id', c.subject_id,
					'subject_name', s.name,
					'instructor_name', ip.full_name,
					'school_id', c.school_id,
					'school_name', sc.name,
					'progress_percentage', e.progress_percentage,
					'enrolled_at', e.enrolled_at,
					'completed_at', e.completed_at,
					'last_accessed_lesson_id', e.last_accessed_lesson_id,
					'certificate_id', e.certificate_id,
					'lessons_total', (
						select count(*)
						from public.lessons l
						where l.course_id = c.id
					),
					'lessons_completed', (
						select count(*)
						from public.lesson_progress lp
						where lp.user_id = p_student_id
							and lp.is_completed = true
							and lp.lesson_id in (
								select l.id
								from public.lessons l
								where l.course_id = c.id
							)
					)
				) as row
				from public.enrollments e
				join public.courses c on c.id = e.course_id
				left join public.grades g on g.id = c.grade_id
				left join public.subjects s on s.id = c.subject_id
				left join public.profiles ip on ip.id = c.instructor_id
				left join public.schools sc on sc.id = c.school_id
				where e.user_id = p_student_id and e.course_id is not null
				order by e.enrolled_at desc nulls last
			) t
		),

		-- Quiz attempts with scores ---------------------------------------
		(
			select coalesce(jsonb_agg(row order by sort_key desc nulls last), '[]'::jsonb)
			from (
				select
					qa.completed_at as sort_key,
					jsonb_build_object(
					'id', qa.id,
					'quiz_id', qa.quiz_id,
					'quiz_title', coalesce(q.title, '—'),
					'quiz_slug', q.slug,
					'score', qa.score,
					'max_score_possible', qa.max_score_possible,
					'score_percentage', case
						when qa.max_score_possible is not null
							and qa.max_score_possible > 0
							and qa.score is not null
						then round((qa.score::numeric / qa.max_score_possible) * 100, 1)
					end,
					'passed', qa.passed,
					'attempt_number', qa.attempt_number,
					'started_at', qa.started_at,
					'completed_at', qa.completed_at,
					'feedback_from_instructor', qa.feedback_from_instructor,
					'grade_name', g.name,
					'subject_name', s.name
				) as row
				from public.quiz_attempts qa
				left join public.quizzes q on q.id = qa.quiz_id
				left join public.grades g on g.id = q.grade_id
				left join public.subjects s on s.id = q.subject_id
				where qa.user_id = p_student_id
				order by qa.completed_at desc nulls last, qa.created_at desc
			) t
		),

		-- Deck (flashcard) progress ----------------------------------------
		(
			select coalesce(jsonb_agg(row order by sort_key desc nulls last), '[]'::jsonb)
			from (
				select
					e.enrolled_at as sort_key,
					jsonb_build_object(
					'id', e.id,
					'deck_id', e.deck_id,
					'deck_name', d.name,
					'deck_slug', d.slug,
					'cover_image_url', d.cover_image_url,
					'grade_name', g.name,
					'subject_name', s.name,
					'progress_percentage', e.progress_percentage,
					'enrolled_at', e.enrolled_at,
					'completed_at', e.completed_at,
					'cards_total', (
						select count(*) from public.deck_cards dc where dc.deck_id = d.id
					),
					'cards_mastered', (
						select count(*)
						from public.deck_cards dc
						where dc.deck_id = d.id
							and dc.status = 'review'::public.card_status
					),
					'leitner_box', l.boxes,
					'last_learn_on', l.last_learn_on
				) as row
				from public.enrollments e
				join public.decks d on d.id = e.deck_id
				left join public.grades g on g.id = d.grade_id
				left join public.subjects s on s.id = d.subject_id
				left join lateral (
					select lz.boxes, lz.last_learn_on
					from public.leitners lz
					where lz.user_id = e.user_id and lz.deck_id = e.deck_id
					order by lz.last_learn_on desc
					limit 1
				) l on true
				where e.user_id = p_student_id and e.deck_id is not null
				order by e.enrolled_at desc nulls last
			) t
		),

		-- Classrooms the student belongs to --------------------------------
		(
			select coalesce(jsonb_agg(row order by sort_key desc nulls last), '[]'::jsonb)
			from (
				select
					cm.created_at as sort_key,
					jsonb_build_object(
					'id', cm.classroom_id,
					'name', c.name,
					'role', cm.role,
					'joined_at', cm.created_at,
					'school_name', sc.name,
					'teacher_name', tp.full_name
				) as row
				from public.classroom_members cm
				join public.classrooms c on c.id = cm.classroom_id
				left join public.schools sc on sc.id = c.school_id
				left join public.profiles tp on tp.id = c.user_id
				where cm.user_id = p_student_id
				order by cm.created_at desc
			) t
		),

		-- Certificates issued ----------------------------------------------
		(
			select coalesce(jsonb_agg(row order by sort_key desc nulls last), '[]'::jsonb)
			from (
				select
					c.issued_at as sort_key,
					jsonb_build_object(
					'id', c.id,
					'course_title', c.course_title,
					'course_id', c.course_id,
					'issued_at', c.issued_at,
					'verification_code', c.verification_code,
					'certificate_pdf_url', c.certificate_pdf_url
				) as row
				from public.certificates c
				where c.user_id = p_student_id
				order by c.issued_at desc nulls last
			) t
		),

		-- Recent activity timeline -----------------------------------------
		(
			select coalesce(jsonb_agg(row order by sort_key desc nulls last), '[]'::jsonb)
			from (
				select
					x.ts as sort_key,
					jsonb_build_object(
					'type', x.kind,
					'label', x.label,
					'ts', x.ts,
					'meta', x.meta
				) as row
				from (
					select
						'enrollment' as kind,
						'Enrolled in ' || c.title as label,
						e.enrolled_at as ts,
						jsonb_build_object('course_title', c.title, 'slug', c.slug) as meta
					from public.enrollments e
					join public.courses c on c.id = e.course_id
					where e.user_id = p_student_id and e.course_id is not null

					union all

					select
						'quiz_attempt' as kind,
						'Quiz attempt: ' || coalesce(q.title, '—') as label,
						qa.completed_at as ts,
						jsonb_build_object(
							'score', qa.score,
							'max_score_possible', qa.max_score_possible,
							'passed', qa.passed
						) as meta
					from public.quiz_attempts qa
					left join public.quizzes q on q.id = qa.quiz_id
					where qa.user_id = p_student_id and qa.completed_at is not null

					union all

					select
						'lesson_completed' as kind,
						'Completed a lesson' as label,
						lp.completed_at as ts,
						jsonb_build_object('lesson_id', lp.lesson_id) as meta
					from public.lesson_progress lp
					where lp.user_id = p_student_id
						and lp.is_completed = true
						and lp.completed_at is not null

					union all

					select
						'note' as kind,
						'Note: ' || coalesce(n.title, 'Untitled') as label,
						n.updated_at as ts,
						jsonb_build_object('note_id', n.id) as meta
					from public.notes n
					where n.user_id = p_student_id

					union all

					select
						'bookmark' as kind,
						'Bookmarked an item' as label,
						b.created_at as ts,
						jsonb_build_object('item_type', b.item_type, 'item_id', b.item_id) as meta
					from public.bookmarks b
					where b.user_id = p_student_id
				) x
				where x.ts is not null
				order by x.ts desc
				limit 25
			) t
		);
end;
$function$;

grant execute on function public.get_admin_student_overview(uuid) to authenticated;


-- ─── 2. Batch overview for the students list ───────────────────────────────
-- Returns one row per student with the counters the list view shows.
-- Kept as a function (not a view) so it can be filtered by the admin's own
-- search/pagination without the caller having to re-implement the joins.
create or replace function public.get_admin_students_overview()
returns table (
	user_id uuid,
	full_name text,
	email text,
	enrolled_courses_count bigint,
	completed_courses_count bigint,
	active_decks_count bigint,
	quiz_attempts_count bigint,
	quizzes_passed_count bigint,
	average_quiz_score numeric,
	bookmarks_count bigint,
	notes_count bigint,
	certificates_count bigint,
	classrooms_count bigint,
	distinct_grades_count bigint,
	distinct_subjects_count bigint,
	grade_names text,
	subject_names text,
	last_activity_at timestamptz
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
		p.id,
		p.full_name,
		p.email,
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p.id and e.course_id is not null
		),
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p.id
				and e.course_id is not null
				and e.completed_at is not null
		),
		(
			select count(*)
			from public.enrollments e
			where e.user_id = p.id and e.deck_id is not null
		),
		(
			select count(*)
			from public.quiz_attempts qa
			where qa.user_id = p.id and qa.completed_at is not null
		),
		(
			select count(*)
			from public.quiz_attempts qa
			where qa.user_id = p.id and qa.passed = true
		),
		(
			select coalesce(
				round(
					avg(
						case
							when qa.max_score_possible is not null
								and qa.max_score_possible > 0
								and qa.score is not null
							then (qa.score::numeric / qa.max_score_possible) * 100
						end
					),
					1
				),
				0
			)
			from public.quiz_attempts qa
			where qa.user_id = p.id and qa.completed_at is not null
		),
		(select count(*) from public.bookmarks b where b.user_id = p.id),
		(select count(*) from public.notes n where n.user_id = p.id),
		(select count(*) from public.certificates c where c.user_id = p.id),
		(
			select count(*)
			from public.classroom_members cm
			where cm.user_id = p.id
		),
		(
			select count(distinct c.grade_id)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			where e.user_id = p.id and c.grade_id is not null
		),
		(
			select count(distinct c.subject_id)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			where e.user_id = p.id and c.subject_id is not null
		),
		(
			select string_agg(distinct g.name, '، ' order by g.name)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			join public.grades g on g.id = c.grade_id
			where e.user_id = p.id
		),
		(
			select string_agg(distinct s.name, '، ' order by s.name)
			from public.enrollments e
			join public.courses c on c.id = e.course_id
			join public.subjects s on s.id = c.subject_id
			where e.user_id = p.id
		),
		(
			select max(x.ts)
			from (
				select e.enrolled_at as ts from public.enrollments e where e.user_id = p.id
				union all
				select qa.created_at from public.quiz_attempts qa where qa.user_id = p.id
				union all
				select lp.last_accessed_at from public.lesson_progress lp where lp.user_id = p.id
			) x
			where x.ts is not null
		)
	from public.profiles p
	where p.role = 'student'::public.user_role;
end;
$function$;

grant execute on function public.get_admin_students_overview() to authenticated;


-- ─── 3. Flattened students view for the list page ──────────────────────────
-- security_invoker so profiles RLS applies to the caller. Admins see every
-- student (their "Admins can select all profiles" policy); everyone else
-- sees only rows the base policies allow.
create or replace view public.admin_students_view
with (security_invoker = on)
as
select
	p.id,
	p.full_name,
	p.email,
	p.phone,
	p.avatar_url,
	p.credit_balance,
	p.student_status,
	p.province_id,
	p.created_at,
	p.updated_at,
	prov.name as province_name,
	(
		select count(*)
		from public.enrollments e
		where e.user_id = p.id and e.course_id is not null
	) as enrolled_courses_count,
	(
		select count(*)
		from public.enrollments e
		where e.user_id = p.id
			and e.course_id is not null
			and e.completed_at is not null
	) as completed_courses_count,
	(
		select count(*)
		from public.enrollments e
		where e.user_id = p.id and e.deck_id is not null
	) as active_decks_count,
	(
		select count(*)
		from public.quiz_attempts qa
		where qa.user_id = p.id and qa.completed_at is not null
	) as quiz_attempts_count,
	(
		select count(*)
		from public.quiz_attempts qa
		where qa.user_id = p.id and qa.passed = true
	) as quizzes_passed_count,
	(
		select coalesce(
			round(
				avg(
					case
						when qa.max_score_possible is not null
							and qa.max_score_possible > 0
							and qa.score is not null
						then (qa.score::numeric / qa.max_score_possible) * 100
					end
				),
				1
			),
			0
		)
		from public.quiz_attempts qa
		where qa.user_id = p.id and qa.completed_at is not null
	) as average_quiz_score,
	(select count(*) from public.bookmarks b where b.user_id = p.id) as bookmarks_count,
	(select count(*) from public.notes n where n.user_id = p.id) as notes_count,
	(
		select count(*)
		from public.certificates c
		where c.user_id = p.id
	) as certificates_count,
	(
		select count(*)
		from public.classroom_members cm
		where cm.user_id = p.id
	) as classrooms_count,
	(
		select count(distinct c.grade_id)
		from public.enrollments e
		join public.courses c on c.id = e.course_id
		where e.user_id = p.id and c.grade_id is not null
	) as distinct_grades_count,
	(
		select count(distinct c.subject_id)
		from public.enrollments e
		join public.courses c on c.id = e.course_id
		where e.user_id = p.id and c.subject_id is not null
	) as distinct_subjects_count,
	(
		select string_agg(distinct g.name, '، ' order by g.name)
		from public.enrollments e
		join public.courses c on c.id = e.course_id
		join public.grades g on g.id = c.grade_id
		where e.user_id = p.id
	) as grade_names,
	(
		select string_agg(distinct s.name, '، ' order by s.name)
		from public.enrollments e
		join public.courses c on c.id = e.course_id
		join public.subjects s on s.id = c.subject_id
		where e.user_id = p.id
	) as subject_names,
	(
		select max(x.ts)
		from (
			select e.enrolled_at as ts from public.enrollments e where e.user_id = p.id
			union all
			select qa.created_at from public.quiz_attempts qa where qa.user_id = p.id
			union all
			select lp.last_accessed_at from public.lesson_progress lp where lp.user_id = p.id
		) x
		where x.ts is not null
	) as last_activity_at
from public.profiles p
left join public.provinces prov on prov.id = p.province_id
where p.role = 'student'::public.user_role;
