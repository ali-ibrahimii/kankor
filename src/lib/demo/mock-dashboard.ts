import type { CurrentUser } from "@/lib/auth/types";
import type {
	InstructorDashboardOverview,
	PlatformAdminOverview,
	SchoolDashboardOverview,
	StudentDashboardOverview,
	TrendPoint,
} from "@/types/queries.types";

/**
 * Mock data for the public `/demo` dashboard preview.
 *
 * Nothing here touches Supabase — it exists purely so the dashboard designs
 * can be reviewed with realistic-looking content (Afghan names, school
 * subjects, credit amounts) without an authenticated session.
 */

export const demoRoles = ["student", "instructor", "school", "admin"] as const;
export type DemoRole = (typeof demoRoles)[number];

/**
 * Key used by the `demo` translation namespace — it calls the instructor
 * "teacher", matching the profile wording used across the product.
 */
export const demoRoleMessageKey: Record<
	DemoRole,
	"student" | "teacher" | "school" | "admin"
> = {
	student: "student",
	instructor: "teacher",
	school: "school",
	admin: "admin",
};

export function normalizeDemoRole(value: string | string[] | undefined) {
	const role = Array.isArray(value) ? value[0] : value;
	return demoRoles.includes(role as DemoRole)
		? (role as DemoRole)
		: ("student" as const);
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function isoDaysAgo(daysAgo: number, hour = 9) {
	const date = new Date();
	date.setHours(hour, 0, 0, 0);
	date.setDate(date.getDate() - daysAgo);
	return date.toISOString();
}

/** Builds a 14-day trend series ending today. */
function trend(
	values: number[],
	key: "count" | "credits" = "count"
): TrendPoint[] {
	return values.map((value, index) => ({
		date: isoDaysAgo(values.length - 1 - index),
		[key]: value,
	}));
}

// ─── Demo accounts ───────────────────────────────────────────────────────────

export const demoProfiles: Record<
	DemoRole,
	{
		full_name: string;
		email: string;
		role: CurrentUser["role"];
		school_id: string | null;
	}
> = {
	student: {
		full_name: "مریم احمدی",
		email: "maryam.ahmadi@example.com",
		role: "student",
		school_id: "demo-school-1",
	},
	instructor: {
		full_name: "استاد احمد رضایی",
		email: "ahmad.rezaei@example.com",
		role: "instructor",
		school_id: null,
	},
	school: {
		full_name: "عبدالبصیر نیازی",
		email: "basir.niazi@example.com",
		role: "admin",
		school_id: "demo-school-1",
	},
	admin: {
		full_name: "سید عمر موسوی",
		email: "omar.mousavi@example.com",
		role: "admin",
		school_id: null,
	},
};

const ProfileStatuses: Record<DemoRole, CurrentUser["instructor_status"]> = {
	student: null,
	instructor: "active",
	school: null,
	admin: null,
};

/** Demo profile shaped exactly like the real `profiles` row + memberships. */
export function getDemoUser(role: DemoRole): CurrentUser {
	const profile = demoProfiles[role];
	const schoolMemberships =
		profile.school_id !== null
			? [
					{
						school_id: profile.school_id,
						role:
							role === "school" ? ("owner" as const) : ("instructor" as const),
					},
				]
			: [];

	return {
		id: `demo-${role}`,
		email: profile.email,
		full_name: profile.full_name,
		avatar_url: null,
		bio: null,
		phone: null,
		province_id: null,
		slug: `demo-${role}`,
		role: profile.role,
		locale: "fa",
		credit_balance: 1250,
		school_id: profile.school_id,
		active_school_id: profile.school_id,
		instructor_status: ProfileStatuses[role],
		instructor_suspended_by_agency_id: null,
		instructor_suspension_reason: null,
		student_status: "active",
		telegram_chat_id: null,
		telegram_linked_at: null,
		website_url: null,
		created_at: "2025-08-14T09:30:00.000Z",
		updated_at: isoDaysAgo(1),
		schoolMemberships,
		agencyMemberships: [],
	};
}

// ─── Student ─────────────────────────────────────────────────────────────────

export const demoStudentOverview: StudentDashboardOverview = {
	enrolled_courses_count: 6,
	active_decks_count: 4,
	notes_count: 27,
	cards_due_today: 38,
	bookmarks_count: 17,
	credit_balance: 1250,
	tests_completed_count: 24,
	tests_passed_count: 19,
	continue_learning: {
		course_id: "demo-course-1",
		course_title: "ریاضی ۱۰ — فصل دوم: هندسه تحلیلی",
		course_slug: "math-10-analytic-geometry",
		progress_percentage: 64,
		last_accessed_lesson_id: "demo-lesson-4",
	},
	recent_quiz_attempts: [
		{
			id: "attempt-1",
			quiz_title: "کانکور آزمایشی — دور سوم",
			score: 82,
			max_score_possible: 100,
			passed: true,
			completed_at: isoDaysAgo(1, 17),
		},
		{
			id: "attempt-2",
			quiz_title: "امتحان فصل دوم فیزیک",
			score: 19,
			max_score_possible: 25,
			passed: true,
			completed_at: isoDaysAgo(3, 20),
		},
		{
			id: "attempt-3",
			quiz_title: "آزمون کیمیا — ساختار اتم",
			score: 12,
			max_score_possible: 20,
			passed: false,
			completed_at: isoDaysAgo(5, 16),
		},
		{
			id: "attempt-4",
			quiz_title: "امتحان دری — دستور زبان",
			score: 21,
			max_score_possible: 25,
			passed: true,
			completed_at: isoDaysAgo(8, 11),
		},
	],
	recent_notes: [
		{
			id: "note-1",
			title: "فرمول‌های مهم مشتق و انتگرال",
			created_at: isoDaysAgo(1, 19),
		},
		{
			id: "note-2",
			title: "خلاصهٔ درس جنگ‌های معاصر افغانستان",
			created_at: isoDaysAgo(2, 15),
		},
		{
			id: "note-3",
			title: "واژه‌های دشوار انگلیسی — درس ۷",
			created_at: isoDaysAgo(4, 10),
		},
		{
			id: "note-4",
			title: "نکات امتحانی بیولوژی: دستگاه گردش خون",
			created_at: isoDaysAgo(6, 21),
		},
	],
	study_activity: trend(
		[9, 14, 7, 18, 24, 4, 6, 21, 27, 13, 10, 3, 19, 23],
		"count"
	),
};

// ─── Instructor ──────────────────────────────────────────────────────────────

export const demoInstructorOverview: InstructorDashboardOverview = {
	published_courses_count: 8,
	draft_courses_count: 3,
	total_students_count: 1246,
	average_rating: 4.7,
	total_decks_count: 14,
	total_quizzes_count: 21,
	total_earnings_credits: 86400,
	earnings_this_month_credits: 12350,
	recent_enrollments: [
		{
			id: "enrollment-1",
			student_name: "زهرا کریمی",
			course_title: "ریاضی ۱۰ — هندسه تحلیلی",
			enrolled_at: isoDaysAgo(0, 8),
		},
		{
			id: "enrollment-2",
			student_name: "علی حسینی",
			course_title: "فیزیک ۱۱ — برق و مغناطیس",
			enrolled_at: isoDaysAgo(1, 14),
		},
		{
			id: "enrollment-3",
			student_name: "سمیرا نوری",
			course_title: "کیمیا ۱۲ — تعادل شیمیایی",
			enrolled_at: isoDaysAgo(2, 10),
		},
		{
			id: "enrollment-4",
			student_name: "محمد یوسفی",
			course_title: "ریاضی ۱۰ — هندسه تحلیلی",
			enrolled_at: isoDaysAgo(3, 17),
		},
	],
	recent_quiz_attempts: [
		{
			id: "attempt-1",
			student_name: "فرشته صادقی",
			quiz_title: "امتحان فصل اول ریاضی",
			score: 23,
			max_score_possible: 25,
			passed: true,
			completed_at: isoDaysAgo(1, 18),
		},
		{
			id: "attempt-2",
			student_name: "نصرالله حیدری",
			quiz_title: "آزمون فیزیک — حرکت",
			score: 14,
			max_score_possible: 25,
			passed: false,
			completed_at: isoDaysAgo(2, 12),
		},
		{
			id: "attempt-3",
			student_name: "مریم احمدی",
			quiz_title: "امتحان فصل دوم فیزیک",
			score: 19,
			max_score_possible: 25,
			passed: true,
			completed_at: isoDaysAgo(3, 20),
		},
	],
	earnings_trend: trend(
		[320, 480, 260, 610, 540, 720, 390, 830, 940, 680, 510, 870, 1020, 760],
		"credits"
	),
};

// ─── School ──────────────────────────────────────────────────────────────────

export const demoSchoolOverview: SchoolDashboardOverview = {
	students_count: 842,
	teachers_count: 38,
	staff_count: 12,
	courses_count: 56,
	decks_count: 74,
	quizzes_count: 91,
	total_earnings_credits: 214600,
	earnings_this_month_credits: 28400,
	recent_members: [
		{
			id: "member-1",
			full_name: "استاد احمد رضایی",
			role: "instructor",
			joined_at: isoDaysAgo(0, 9),
		},
		{
			id: "member-2",
			full_name: "خانم شکیبا رسولی",
			role: "staff",
			joined_at: isoDaysAgo(2, 13),
		},
		{
			id: "member-3",
			full_name: "استاد نادیه اکبری",
			role: "instructor",
			joined_at: isoDaysAgo(4, 11),
		},
		{
			id: "member-4",
			full_name: "آقای رحیم‌الله زاهدی",
			role: "admin",
			joined_at: isoDaysAgo(6, 16),
		},
	],
	recent_quiz_attempts: [
		{
			id: "attempt-1",
			student_name: "زهرا کریمی",
			quiz_title: "امتحان فصل اول ریاضی",
			score: 23,
			max_score_possible: 25,
			passed: true,
			completed_at: isoDaysAgo(1, 18),
		},
		{
			id: "attempt-2",
			student_name: "علی حسینی",
			quiz_title: "آزمون فیزیک — حرکت",
			score: 14,
			max_score_possible: 25,
			passed: false,
			completed_at: isoDaysAgo(2, 12),
		},
		{
			id: "attempt-3",
			student_name: "سمیرا نوری",
			quiz_title: "امتحان کیمیا — پیوند شیمیایی",
			score: 18,
			max_score_possible: 20,
			passed: true,
			completed_at: isoDaysAgo(3, 9),
		},
	],
	earnings_trend: trend(
		[
			960, 1240, 880, 1510, 1330, 1720, 1190, 1830, 2140, 1680, 1410, 1970,
			2420, 2260,
		],
		"credits"
	),
};

// ─── Platform admin ──────────────────────────────────────────────────────────

export const demoAdminOverview: PlatformAdminOverview = {
	students_count: 24318,
	instructors_count: 412,
	schools_active_count: 87,
	schools_pending_count: 6,
	pending_instructor_approvals: 14,
	courses_published_count: 356,
	courses_draft_count: 72,
	decks_count: 1284,
	quizzes_count: 926,
	total_revenue_credits: 4862000,
	revenue_this_month_credits: 512400,
	recent_signups: [
		{
			id: "signup-1",
			full_name: "زهرا کریمی",
			role: "student",
			created_at: isoDaysAgo(0, 8),
		},
		{
			id: "signup-2",
			full_name: "مکتب سپیدهٔ دانش",
			role: "admin",
			created_at: isoDaysAgo(0, 11),
		},
		{
			id: "signup-3",
			full_name: "استاد نادیه اکبری",
			role: "instructor",
			created_at: isoDaysAgo(1, 14),
		},
		{
			id: "signup-4",
			full_name: "علی حسینی",
			role: "student",
			created_at: isoDaysAgo(1, 19),
		},
		{
			id: "signup-5",
			full_name: "سمیرا نوری",
			role: "student",
			created_at: isoDaysAgo(2, 10),
		},
	],
	revenue_trend: trend(
		[
			18400, 22600, 19800, 26400, 31200, 27800, 24500, 35200, 41800, 36900,
			29400, 44300, 47900, 39500,
		],
		"credits"
	),
	signup_trend: trend(
		[82, 104, 96, 128, 143, 117, 109, 156, 174, 148, 132, 189, 211, 167],
		"count"
	),
};
