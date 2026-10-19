import { Database, Tables } from "@/lib/supabase/database.types";

export type LessonProgressItem = Pick<
	Tables<"lesson_progress">,
	| "id"
	| "is_completed"
	| "completed_at"
	| "last_accessed_at"
	| "video_progress_seconds"
>;

export type LessonItem = Pick<
	Tables<"lessons">,
	| "id"
	| "title"
	| "content_type"
	| "order_index"
	| "estimated_duration_minutes"
	| "is_previewable"
> & {
	is_active?: boolean;
	lesson_progress: LessonProgressItem | null;
};

export type ModuleItem = Pick<
	Tables<"modules">,
	"id" | "title" | "description" | "order_index"
> & {
	lessons: LessonItem[];
};

export type CourseDetail = Omit<
	Database["public"]["Functions"]["get_course_details"]["Returns"][number],
	"modules" | "enrollment"
> & {
	modules: ModuleItem[];
	enrollment?: EnrollmentItem | null;
};

export type EnrollmentItem = Pick<
	Tables<"enrollments">,
	| "progress_percentage"
	| "last_accessed_lesson_id"
	| "completed_at"
	| "enrolled_at"
>;

export type DeckEnrollmentItem = Pick<Tables<"enrollments">, "enrolled_at">;

export type DeckFlashcardAnswer = { answer: string; isCorrect: boolean };

/** A flashcard as embedded in `get_deck_details.flashcards` — owner-only, null otherwise. */
export type DeckFlashcardItem = Pick<
	Tables<"flashcards">,
	| "id"
	| "question"
	| "fact"
	| "hint"
	| "img_path"
	| "vid_path"
	| "page"
	| "created_at"
> & {
	answers: DeckFlashcardAnswer[];
};

export type DeckDetail = Omit<
	Database["public"]["Functions"]["get_deck_details"]["Returns"][number],
	"enrollment" | "flashcards" | "config"
> & {
	enrollment?: DeckEnrollmentItem | null;
	/** Full card content — populated only when the caller owns the deck. */
	flashcards: DeckFlashcardItem[] | null;
	config: Record<string, unknown> | null;
};

export type ReviewerInfo = {
	name: string | null;
	avatar: string | null;
};

/** A single row returned by `get_reviews` — `total_count` is the same window-count on every row. */
export type ReviewItem = Omit<
	Database["public"]["Functions"]["get_reviews"]["Returns"][number],
	"reviewer"
> & {
	reviewer: ReviewerInfo;
};

export type ReviewBreakdownItem =
	Database["public"]["Functions"]["get_review_breakdown"]["Returns"][number];

export type LibraryDetail =
	Database["public"]["Functions"]["get_library_details"]["Returns"][number];

export type QuizDetail =
	Database["public"]["Functions"]["get_quiz_details"]["Returns"][number];

// ─── Dashboard overview RPCs ────────────────────────────────────────────────

export type TrendPoint = { date: string; count?: number; credits?: number };

export type ContinueLearningItem = {
	course_id: string;
	course_title: string;
	course_slug: string;
	progress_percentage: number | null;
	last_accessed_lesson_id: string | null;
} | null;

export type RecentQuizAttemptItem = {
	id: string;
	quiz_title: string;
	score: number | null;
	max_score_possible: number | null;
	passed: boolean | null;
	completed_at: string;
	student_name?: string;
};

export type RecentNoteItem = {
	id: string;
	title: string | null;
	created_at: string;
};

export type RecentEnrollmentItem = {
	id: string;
	student_name: string;
	course_title: string;
	enrolled_at: string;
};

export type RecentMemberItem = {
	id: string;
	full_name: string;
	role: Database["public"]["Enums"]["school_member_role"];
	joined_at: string;
};

export type RecentSignupItem = {
	id: string;
	full_name: string;
	role: Database["public"]["Enums"]["user_role"];
	created_at: string;
};

export type StudentDashboardOverview = Omit<
	Database["public"]["Functions"]["get_student_dashboard_overview"]["Returns"][number],
	| "continue_learning"
	| "recent_quiz_attempts"
	| "recent_notes"
	| "study_activity"
> & {
	continue_learning: ContinueLearningItem;
	recent_quiz_attempts: RecentQuizAttemptItem[];
	recent_notes: RecentNoteItem[];
	study_activity: TrendPoint[];
};

export type InstructorDashboardOverview = Omit<
	Database["public"]["Functions"]["get_instructor_dashboard_overview"]["Returns"][number],
	"recent_enrollments" | "recent_quiz_attempts" | "earnings_trend"
> & {
	recent_enrollments: RecentEnrollmentItem[];
	recent_quiz_attempts: RecentQuizAttemptItem[];
	earnings_trend: TrendPoint[];
};

export type SchoolDashboardOverview = Omit<
	Database["public"]["Functions"]["get_school_dashboard_overview"]["Returns"][number],
	"recent_members" | "recent_quiz_attempts" | "earnings_trend"
> & {
	recent_members: RecentMemberItem[];
	recent_quiz_attempts: RecentQuizAttemptItem[];
	earnings_trend: TrendPoint[];
};

export type PlatformAdminOverview = Omit<
	Database["public"]["Functions"]["get_platform_admin_overview"]["Returns"][number],
	"recent_signups" | "revenue_trend" | "signup_trend"
> & {
	recent_signups: RecentSignupItem[];
	revenue_trend: TrendPoint[];
	signup_trend: TrendPoint[];
};
