/**
 * Runs the admin-student-overview migration against a real PostgreSQL engine
 * (PGlite — Postgres compiled to WASM) to verify that the SQL actually
 * executes, not just that it parses.
 *
 * The script:
 *   1. creates the minimal schema the migration touches,
 *   2. applies the migration,
 *   3. inserts a student with enrollments, quiz attempts, decks and
 *      classrooms,
 *   4. calls `get_admin_student_overview()` and asserts the numbers,
 *   5. asserts the `admin_students_view` rows carry the same counters.
 *
 * Usage:
 *   node scripts/test-admin-student-migration.js
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MIGRATION = path.join(
	ROOT,
	"supabase/migrations/20261104000000_admin_student_overview.sql"
);

// PGlite lives outside the repo (installed in a scratch dir) because it is a
// dev-only dependency; fall back to a local install if present.
function loadPGlite() {
	for (const candidate of [
		"/tmp/pglite-test/node_modules/@electric-sql/pglite",
		path.join(ROOT, "node_modules/@electric-sql/pglite"),
	]) {
		try {
			return require(candidate);
		} catch {
			// try the next candidate
		}
	}
	throw new Error(
		"@electric-sql/pglite not found — install it in /tmp/pglite-test to run this script"
	);
}

const { PGlite } = loadPGlite();

// ─── Minimal schema the migration depends on ─────────────────────────────────

const SCHEMA = `
create schema if not exists auth;

-- Supabase creates these roles; the migration grants execute to them.
do $$
begin
	if not exists (select 1 from pg_roles where rolname = 'authenticated') then
		create role authenticated nologin;
	end if;
	if not exists (select 1 from pg_roles where rolname = 'anon') then
		create role anon nologin;
	end if;
end
$$;

-- Supabase provides this; the stub lets is_admin() resolve its default.
create or replace function auth.uid() returns uuid language sql stable as $$
	select null::uuid;
$$;

create type public.user_role as enum ('student', 'instructor', 'admin');
create type public.account_status as enum ('pending', 'active', 'rejected', 'suspended', 'disabled');
create type public.card_status as enum ('new', 'learning', 'review', 'relearning');
create type public.classroom_role as enum ('student', 'teacher', 'admin');
create type public.bookmarkable_item_type as enum ('course', 'deck', 'quiz', 'library');

create table public.provinces (
	id uuid primary key default gen_random_uuid(),
	name text not null
);

create table public.profiles (
	id uuid primary key default gen_random_uuid(),
	full_name text,
	email text,
	phone text,
	avatar_url text,
	bio text,
	credit_balance integer not null default 0,
	student_status public.account_status not null default 'pending',
	province_id uuid references public.provinces(id),
	role public.user_role not null default 'student',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.grades (id uuid primary key default gen_random_uuid(), name text not null);
create table public.subjects (id uuid primary key default gen_random_uuid(), name text not null);
create table public.schools (id uuid primary key default gen_random_uuid(), name text not null);

create table public.courses (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	slug text,
	cover_image_url text,
	grade_id uuid references public.grades(id),
	subject_id uuid references public.subjects(id),
	school_id uuid references public.schools(id),
	instructor_id uuid references public.profiles(id),
	level text,
	language text,
	price_credits integer default 0,
	is_free boolean default false,
	is_published boolean default false
);

create table public.lessons (
	id uuid primary key default gen_random_uuid(),
	course_id uuid references public.courses(id),
	module_id uuid,
	title text
);

create table public.modules (
	id uuid primary key default gen_random_uuid(),
	course_id uuid references public.courses(id),
	title text
);

create table public.decks (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text,
	cover_image_url text,
	grade_id uuid references public.grades(id),
	subject_id uuid references public.subjects(id),
	user_id uuid references public.profiles(id)
);

create table public.deck_cards (
	id uuid primary key default gen_random_uuid(),
	deck_id uuid not null references public.decks(id),
	user_id uuid references public.profiles(id),
	status public.card_status not null default 'new'
);

create table public.leitners (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id),
	deck_id uuid references public.decks(id),
	name text,
	boxes smallint not null default 5,
	last_learn_on date not null default now()
);

create table public.enrollments (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id),
	course_id uuid references public.courses(id),
	deck_id uuid references public.decks(id),
	progress_percentage integer default 0,
	enrolled_at timestamptz not null default now(),
	completed_at timestamptz,
	last_accessed_lesson_id uuid,
	flashcard_daily_limit integer,
	certificate_id uuid,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.quizzes (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	slug text,
	grade_id uuid references public.grades(id),
	subject_id uuid references public.subjects(id),
	user_id uuid references public.profiles(id),
	passing_score_percentage integer
);

create table public.quiz_attempts (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id),
	quiz_id uuid not null references public.quizzes(id),
	enrollment_id uuid references public.enrollments(id),
	attempt_number integer default 1,
	score integer,
	max_score_possible integer,
	passed boolean,
	started_at timestamptz,
	completed_at timestamptz,
	feedback_from_instructor text,
	created_at timestamptz not null default now()
);

create table public.lesson_progress (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id),
	enrollment_id uuid references public.enrollments(id),
	lesson_id uuid references public.lessons(id),
	is_completed boolean not null default false,
	video_progress_seconds integer default 0,
	last_accessed_at timestamptz,
	completed_at timestamptz,
	created_at timestamptz not null default now()
);

create table public.classrooms (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	user_id uuid references public.profiles(id),
	school_id uuid references public.schools(id),
	cover_image text,
	description text,
	is_archived boolean default false,
	join_code text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.classroom_members (
	id uuid primary key default gen_random_uuid(),
	classroom_id uuid not null references public.classrooms(id),
	user_id uuid not null references public.profiles(id),
	role public.classroom_role not null default 'student',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.certificates (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id),
	course_id uuid references public.courses(id),
	course_title text,
	user_full_name text,
	verification_code text,
	certificate_pdf_url text,
	issued_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.bookmarks (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id),
	item_id uuid,
	item_type public.bookmarkable_item_type,
	notes text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table public.notes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.profiles(id),
	title text,
	content text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- The admin gate the RPC relies on.
create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
	select exists (
		select 1 from public.profiles
		where id = user_id and role = 'admin'
	);
$$;
`;

// ─── Assertions ──────────────────────────────────────────────────────────────

let failures = 0;

// Postgres bigints come back as JS BigInt and numerics as strings, while
// the expectations are plain JS numbers. Compare numerically where both
// sides look like numbers, so 90 and "90.0" are considered equal.
function normalize(value) {
	if (typeof value === "bigint") return value.toString();
	if (Array.isArray(value)) return value.map(normalize);
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, normalize(item)])
		);
	}
	return value;
}

function isNumeric(value) {
	if (typeof value === "number") return Number.isFinite(value);
	if (typeof value === "bigint") return true;
	if (typeof value === "string" && value.trim() !== "") {
		return Number.isFinite(Number(value));
	}
	return false;
}

function valuesEqual(actual, expected) {
	if (isNumeric(actual) && isNumeric(expected)) {
		return Number(actual) === Number(expected);
	}
	return (
		JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected))
	);
}

function check(label, actual, expected) {
	if (valuesEqual(actual, expected)) {
		console.log(`  ✔ ${label}`);
	} else {
		console.error(`  ✘ ${label}`);
		console.error(`      expected: ${JSON.stringify(normalize(expected))}`);
		console.error(`      actual:   ${JSON.stringify(normalize(actual))}`);
		failures++;
	}
}

function checkTruthy(label, actual) {
	const ok = Boolean(actual);
	if (ok) console.log(`  ✔ ${label}`);
	else {
		console.error(`  ✘ ${label} (got ${JSON.stringify(actual)})`);
		failures++;
	}
}

async function main() {
	const db = new PGlite();

	console.log("▸ Creating schema…");
	await db.exec(SCHEMA);

	console.log("▸ Applying the migration…");
	const migration = fs.readFileSync(MIGRATION, "utf8");
	await db.exec(migration);

	console.log("▸ Seeding data…");
	await db.exec(`
		insert into public.provinces (id, name) values ('11111111-1111-1111-1111-111111111111', 'Kabul');

		insert into public.profiles (id, full_name, email, role, student_status, credit_balance, province_id)
		values
			('aaaaaaaa-0000-0000-0000-000000000001', 'Amina Kabuli', 'amina@example.com', 'student', 'active', 120, '11111111-1111-1111-1111-111111111111'),
			('aaaaaaaa-0000-0000-0000-000000000002', 'Bilal Ahmad', 'bilal@example.com', 'student', 'active', 40, '11111111-1111-1111-1111-111111111111'),
			('bbbbbbbb-0000-0000-0000-000000000001', 'Haji Noor', 'noor@example.com', 'instructor', 'active', 0, null),
			('cccccccc-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'admin', 'active', 0, null);

		insert into public.grades (id, name) values
			('dddddddd-0000-0000-0000-000000000001', 'Grade 10'),
			('dddddddd-0000-0000-0000-000000000002', 'Grade 11');

		insert into public.subjects (id, name) values
			('eeeeeeee-0000-0000-0000-000000000001', 'Mathematics'),
			('eeeeeeee-0000-0000-0000-000000000002', 'Physics');

		insert into public.schools (id, name) values
			('ffffffff-0000-0000-0000-000000000001', 'Kabul International School');

		insert into public.courses (id, title, slug, grade_id, subject_id, school_id, instructor_id, is_published)
		values
			('11111111-0000-0000-0000-000000000001', 'Algebra I', 'algebra-i', 'dddddddd-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', true),
			('11111111-0000-0000-0000-000000000002', 'Physics I', 'physics-i', 'dddddddd-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', null, 'bbbbbbbb-0000-0000-0000-000000000001', true);

		insert into public.lessons (id, course_id, title) values
			('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Lesson 1'),
			('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Lesson 2'),
			('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Lesson 3');

		insert into public.decks (id, name, slug, grade_id, subject_id, user_id)
		values ('33333333-0000-0000-0000-000000000001', 'Chemistry Cards', 'chemistry-cards', 'dddddddd-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001');

		insert into public.deck_cards (deck_id, user_id, status) values
			('33333333-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'review'),
			('33333333-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'learning'),
			('33333333-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'review'),
			('33333333-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'new');

		insert into public.leitners (user_id, deck_id, name, boxes, last_learn_on)
		values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Chemistry Cards', 4, '2026-03-01');

		insert into public.enrollments (id, user_id, course_id, progress_percentage, enrolled_at, completed_at)
		values
			('44444444-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 50, '2026-01-10', null),
			('44444444-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 100, '2026-01-15', '2026-02-01');

		insert into public.enrollments (id, user_id, deck_id, progress_percentage, enrolled_at)
		values ('44444444-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 75, '2026-02-10');

		insert into public.quizzes (id, title, slug, grade_id, subject_id, user_id)
		values
			('55555555-0000-0000-0000-000000000001', 'Algebra Midterm', 'algebra-midterm', 'dddddddd-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001'),
			('55555555-0000-0000-0000-000000000002', 'Physics Quiz', 'physics-quiz', 'dddddddd-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001');

		insert into public.quiz_attempts (id, user_id, quiz_id, attempt_number, score, max_score_possible, passed, started_at, completed_at, feedback_from_instructor)
		values
			('66666666-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 1, 18, 20, true, '2026-02-01', '2026-02-01', 'Excellent'),
			('66666666-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', 1, 4, 20, false, '2026-02-05', '2026-02-05', null),
			('66666666-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 2, 15, 20, true, '2026-02-10', '2026-02-10', 'Better');

		insert into public.lesson_progress (user_id, enrollment_id, lesson_id, is_completed, video_progress_seconds, last_accessed_at, completed_at)
		values
			('aaaaaaaa-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', true, 600, '2026-01-20', '2026-01-20'),
			('aaaaaaaa-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', false, 120, '2026-02-01', null),
			('aaaaaaaa-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', true, 900, '2026-02-02', '2026-02-02');

		insert into public.classrooms (id, name, user_id, school_id)
		values ('77777777-0000-0000-0000-000000000001', 'Physics A', 'bbbbbbbb-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001');

		insert into public.classroom_members (classroom_id, user_id, role)
		values ('77777777-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'student');

		insert into public.certificates (user_id, course_id, course_title, verification_code, issued_at)
		values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Algebra I', 'CERT-001', '2026-02-01');

		insert into public.bookmarks (user_id, item_id, item_type) values
			('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'course'),
			('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'course'),
			('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'deck');

		insert into public.notes (user_id, title, content) values
			('aaaaaaaa-0000-0000-0000-000000000001', 'Formula sheet', 'x^2 + bx + c'),
			('aaaaaaaa-0000-0000-0000-000000000001', 'Exam tips', 'Study early');
	`);

	console.log("▸ Calling get_admin_student_overview()…");
	// The RPC checks auth.uid(); PGlite has no auth schema populated, so we
	// stub it for the duration of the test.
	await db.exec(`
		create or replace function auth.uid() returns uuid language sql stable as $$
			select 'cccccccc-0000-0000-0000-000000000001'::uuid;
		$$;
	`);

	const { rows } = await db.query(`
		select * from public.get_admin_student_overview('aaaaaaaa-0000-0000-0000-000000000001');
	`);

	check("returns one row", rows.length, 1);
	const overview = rows[0];

	if (!overview) {
		console.error("\n✘ No overview row returned — aborting.");
		process.exit(1);
	}

	console.log("\n▸ Aggregate counters");
	check("enrolled_courses_count", overview.enrolled_courses_count, 2);
	check("completed_courses_count", overview.completed_courses_count, 1);
	check("in_progress_courses_count", overview.in_progress_courses_count, 1);
	check("active_decks_count", overview.active_decks_count, 1);
	check("quiz_attempts_count", overview.quiz_attempts_count, 3);
	check("quizzes_passed_count", overview.quizzes_passed_count, 2);
	check("quizzes_failed_count", overview.quizzes_failed_count, 1);
	check("average_quiz_score", overview.average_quiz_score, 61.7);
	check("best_quiz_score", overview.best_quiz_score, 90.0);
	check("bookmarks_count", overview.bookmarks_count, 3);
	check("notes_count", overview.notes_count, 2);
	check("certificates_count", overview.certificates_count, 1);
	check("classrooms_count", overview.classrooms_count, 1);
	check("lessons_completed_count", overview.lessons_completed_count, 2);
	check("study_minutes_count", overview.study_minutes_count, 27);
	check("distinct_grades_count", overview.distinct_grades_count, 2);
	check("distinct_subjects_count", overview.distinct_subjects_count, 2);
	checkTruthy("first_enrolled_at is set", overview.first_enrolled_at);
	checkTruthy("last_activity_at is set", overview.last_activity_at);

	console.log("\n▸ Collections");
	const enrollments = overview.course_enrollments;
	check("two course enrollments", enrollments.length, 2);
	const algebra = enrollments.find((e) => e.course_title === "Algebra I");
	checkTruthy("Algebra I is present", algebra);
	check("  grade name", algebra?.grade_name, "Grade 10");
	check("  subject name", algebra?.subject_name, "Mathematics");
	check("  instructor name", algebra?.instructor_name, "Haji Noor");
	check("  school name", algebra?.school_name, "Kabul International School");
	check("  lessons total", algebra?.lessons_total, 2);
	check("  lessons completed", algebra?.lessons_completed, 1);
	check("  progress", algebra?.progress_percentage, 50);

	const attempts = overview.quiz_attempts;
	check("three quiz attempts", attempts.length, 3);
	const midterm = attempts.find(
		(a) => a.quiz_title === "Algebra Midterm' AND 1=1"
	);
	check("no SQL injection in the title lookup", midterm, undefined);
	const algebraAttempts = attempts.filter(
		(a) => a.quiz_title === "Algebra Midterm"
	);
	check("  two Algebra Midterm attempts", algebraAttempts.length, 2);
	// The array is newest-first, so index 0 is attempt #2.
	const newest = algebraAttempts[0];
	check("  newest attempt number", newest?.attempt_number, 2);
	check("  newest attempt score", newest?.score, 15);
	check("  newest attempt percentage", newest?.score_percentage, 75.0);
	check("  newest attempt passed", newest?.passed, true);
	check(
		"  newest attempt feedback",
		newest?.feedback_from_instructor,
		"Better"
	);
	const oldest = algebraAttempts[1];
	check("  oldest attempt score", oldest?.score, 18);
	check("  oldest attempt percentage", oldest?.score_percentage, 90.0);
	check(
		"  oldest attempt feedback",
		oldest?.feedback_from_instructor,
		"Excellent"
	);

	const decks = overview.deck_progress;
	check("one deck", decks.length, 1);
	check("  deck name", decks[0]?.deck_name, "Chemistry Cards");
	check("  cards total", decks[0]?.cards_total, 4);
	check("  cards mastered", decks[0]?.cards_mastered, 2);
	check("  leitner box", decks[0]?.leitner_box, 4);

	const classrooms = overview.classrooms;
	check("one classroom", classrooms.length, 1);
	check("  classroom name", classrooms[0]?.name, "Physics A");
	check("  classroom role", classrooms[0]?.role, "student");
	check("  classroom teacher", classrooms[0]?.teacher_name, "Haji Noor");

	const certificates = overview.certificates;
	check("one certificate", certificates.length, 1);
	check("  certificate title", certificates[0]?.course_title, "Algebra I");
	check("  verification code", certificates[0]?.verification_code, "CERT-001");

	const activity = overview.activity;
	checkTruthy("activity timeline is populated", activity.length > 0);
	check(
		"activity is sorted newest first",
		activity.every(
			(entry, i) =>
				i === 0 || new Date(activity[i - 1].ts) >= new Date(entry.ts)
		),
		true
	);

	console.log("\n▸ admin_students_view");
	const { rows: viewRows } = await db.query(`
		select * from public.admin_students_view order by full_name;
	`);
	check("only students are listed", viewRows.length, 2);
	const amina = viewRows.find((r) => r.full_name === "Amina Kabuli");
	check("  enrolled courses", amina?.enrolled_courses_count, 2);
	check("  quiz attempts", amina?.quiz_attempts_count, 3);
	check("  average score", amina?.average_quiz_score, 61.7);
	check("  grade names", amina?.grade_names, "Grade 10، Grade 11");
	check("  subject names", amina?.subject_names, "Mathematics، Physics");
	check("  province name", amina?.province_name, "Kabul");
	check("  certificates", amina?.certificates_count, 1);

	console.log("\n▸ Batch overview");
	const { rows: batch } = await db.query(
		`select * from public.get_admin_students_overview() order by full_name;`
	);
	check("two students", batch.length, 2);
	check("  Amina enrolled courses", batch[0]?.enrolled_courses_count, 2);
	check("  Amina average score", batch[0]?.average_quiz_score, 61.7);
	check("  Amina grade names", batch[0]?.grade_names, "Grade 10، Grade 11");

	console.log("\n▸ Non-admin access is blocked");
	await db.exec(`
		create or replace function auth.uid() returns uuid language sql stable as $$
			select 'aaaaaaaa-0000-0000-0000-000000000001'::uuid;
		$$;
	`);
	let blocked = false;
	try {
		await db.query(
			`select * from public.get_admin_student_overview('aaaaaaaa-0000-0000-0000-000000000001');`
		);
	} catch (error) {
		blocked = String(error).includes("Admin access required");
	}
	check("a non-admin gets an error", blocked, true);

	await db.close();

	if (failures > 0) {
		console.error(`\n✘ ${failures} assertion(s) failed.`);
		process.exit(1);
	}

	console.log("\n✔ All migration assertions passed.");
}

main().catch((error) => {
	console.error("✘ Migration test failed:");
	console.error(error);
	process.exit(1);
});
