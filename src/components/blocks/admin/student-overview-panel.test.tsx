import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AdminStudentOverview } from "@/lib/data/admin-students";
import {
	StudentActivityTimeline,
	StudentCertificatesTable,
	StudentClassroomsTable,
	StudentDecksTable,
	StudentEnrollmentsTable,
	StudentQuizAttemptsTable,
	StudentStatsGrid,
	StudentSummaryCards,
} from "./student-overview-panel";

/**
 * The admin student panels are the visible half of the student detail page.
 * These tests render them with realistic payloads to make sure the data
 * actually reaches the DOM — a silently-empty table would look identical to
 * "this student has no data" without these assertions.
 */

// next-intl needs a provider; a tiny stub keeps the components under test
// focused on their rendering, not on the translation plumbing.
vi.mock("next-intl", () => ({
	useTranslations: () => (key: string, values?: Record<string, unknown>) => {
		if (values && typeof values.count === "number") {
			return `${key}:${values.count}`;
		}
		return key;
	},
}));

function makeOverview(
	overrides: Partial<AdminStudentOverview> = {}
): AdminStudentOverview {
	return {
		enrolled_courses_count: 3,
		completed_courses_count: 1,
		in_progress_courses_count: 2,
		active_decks_count: 2,
		quiz_attempts_count: 4,
		quizzes_passed_count: 3,
		quizzes_failed_count: 1,
		average_quiz_score: 78.5,
		best_quiz_score: 95,
		bookmarks_count: 6,
		notes_count: 2,
		certificates_count: 1,
		classrooms_count: 1,
		lessons_completed_count: 18,
		study_minutes_count: 320,
		distinct_grades_count: 2,
		distinct_subjects_count: 3,
		first_enrolled_at: "2026-01-10T00:00:00Z",
		last_activity_at: "2026-03-02T00:00:00Z",
		course_enrollments: [],
		quiz_attempts: [],
		deck_progress: [],
		classrooms: [],
		certificates: [],
		activity: [],
		...overrides,
	} as AdminStudentOverview;
}

describe("StudentStatsGrid", () => {
	it("renders the aggregate counters", () => {
		render(<StudentStatsGrid overview={makeOverview()} />);

		expect(screen.getByText("stats.enrolledCourses")).toBeInTheDocument();
		expect(screen.getByText("stats.averageScore")).toBeInTheDocument();
		expect(screen.getByText("stats.quizAttempts")).toBeInTheDocument();
		expect(screen.getByText("stats.lessonsCompleted")).toBeInTheDocument();
		// The counter values themselves.
		expect(screen.getByText("18")).toBeInTheDocument();
	});
});

describe("StudentEnrollmentsTable", () => {
	it("shows the empty state when the student has no enrollments", () => {
		render(<StudentEnrollmentsTable enrollments={[]} />);
		expect(screen.getByText("empty.noEnrollments")).toBeInTheDocument();
	});

	it("lists every enrollment with its grade, instructor and progress", () => {
		render(
			<StudentEnrollmentsTable
				enrollments={[
					{
						id: "e1",
						course_id: "c1",
						course_title: "Algebra I",
						course_slug: "algebra-i",
						cover_image_url: null,
						grade_id: "g1",
						grade_name: "Grade 10",
						subject_id: "s1",
						subject_name: "Mathematics",
						instructor_name: "Ahmad Rahimi",
						school_id: null,
						school_name: null,
						progress_percentage: 60,
						enrolled_at: "2026-01-10T00:00:00Z",
						completed_at: null,
						last_accessed_lesson_id: null,
						certificate_id: null,
						lessons_total: 10,
						lessons_completed: 6,
					},
					{
						id: "e2",
						course_id: "c2",
						course_title: "Physics I",
						course_slug: null,
						cover_image_url: null,
						grade_id: "g2",
						grade_name: "Grade 11",
						subject_id: "s2",
						subject_name: "Physics",
						instructor_name: null,
						school_id: null,
						school_name: null,
						progress_percentage: 100,
						enrolled_at: "2026-02-01T00:00:00Z",
						completed_at: "2026-02-20T00:00:00Z",
						last_accessed_lesson_id: null,
						certificate_id: null,
						lessons_total: 8,
						lessons_completed: 8,
					},
				]}
			/>
		);

		expect(screen.getByText("Algebra I")).toBeInTheDocument();
		expect(screen.getByText("Physics I")).toBeInTheDocument();
		expect(screen.getByText("Grade 10")).toBeInTheDocument();
		expect(screen.getByText("Mathematics")).toBeInTheDocument();
		expect(screen.getByText("Ahmad Rahimi")).toBeInTheDocument();
		// The lesson progress label carries both numbers — once per enrollment.
		expect(screen.getAllByText("coursesTable.lessons")).toHaveLength(2);
		// One enrollment is still in progress, the other is completed.
		expect(screen.getByText("coursesTable.inProgress")).toBeInTheDocument();
		expect(screen.getByText("coursesTable.completed")).toBeInTheDocument();
	});
});

describe("StudentQuizAttemptsTable", () => {
	it("shows the empty state when there are no attempts", () => {
		render(<StudentQuizAttemptsTable attempts={[]} />);
		expect(screen.getByText("empty.noQuizAttempts")).toBeInTheDocument();
	});

	it("renders each attempt with its score and result", () => {
		render(
			<StudentQuizAttemptsTable
				attempts={[
					{
						id: "q1",
						quiz_id: "z1",
						quiz_title: "Algebra Midterm",
						quiz_slug: null,
						score: 18,
						max_score_possible: 20,
						score_percentage: 90,
						passed: true,
						attempt_number: 1,
						started_at: null,
						completed_at: "2026-02-01T00:00:00Z",
						feedback_from_instructor: "Excellent work",
						grade_name: "Grade 10",
						subject_name: "Mathematics",
					},
					{
						id: "q2",
						quiz_id: "z2",
						quiz_title: "Physics Quiz",
						quiz_slug: null,
						score: 4,
						max_score_possible: 20,
						score_percentage: 20,
						passed: false,
						attempt_number: 2,
						started_at: null,
						completed_at: "2026-02-05T00:00:00Z",
						feedback_from_instructor: null,
						grade_name: null,
						subject_name: null,
					},
				]}
			/>
		);

		expect(screen.getByText("Algebra Midterm")).toBeInTheDocument();
		expect(screen.getByText("Physics Quiz")).toBeInTheDocument();
		expect(screen.getByText("90%")).toBeInTheDocument();
		expect(screen.getByText("20%")).toBeInTheDocument();
		expect(screen.getByText("Excellent work")).toBeInTheDocument();
	});
});

describe("StudentDecksTable", () => {
	it("shows the empty state when the student has no decks", () => {
		render(<StudentDecksTable decks={[]} />);
		expect(screen.getByText("empty.noDecks")).toBeInTheDocument();
	});

	it("shows mastered and total cards", () => {
		render(
			<StudentDecksTable
				decks={[
					{
						id: "d1",
						deck_id: "dk1",
						deck_name: "Chemistry Flashcards",
						deck_slug: null,
						cover_image_url: null,
						grade_name: "Grade 11",
						subject_name: "Chemistry",
						progress_percentage: 40,
						enrolled_at: null,
						completed_at: null,
						cards_total: 50,
						cards_mastered: 20,
						leitner_box: 3,
						last_learn_on: "2026-03-01",
					},
				]}
			/>
		);

		expect(screen.getByText("Chemistry Flashcards")).toBeInTheDocument();
		expect(screen.getByText("20 / 50")).toBeInTheDocument();
		expect(screen.getByText("2026-03-01")).toBeInTheDocument();
	});
});

describe("StudentClassroomsTable", () => {
	it("shows the empty state when the student is in no classroom", () => {
		render(<StudentClassroomsTable classrooms={[]} />);
		expect(screen.getByText("empty.noClassrooms")).toBeInTheDocument();
	});

	it("lists classrooms with teacher and school", () => {
		render(
			<StudentClassroomsTable
				classrooms={[
					{
						id: "cl1",
						name: "Physics A",
						role: "student",
						joined_at: "2026-01-05T00:00:00Z",
						school_name: "Kabul International School",
						teacher_name: "Sami Karimi",
					},
				]}
			/>
		);

		expect(screen.getByText("Physics A")).toBeInTheDocument();
		expect(screen.getByText("Sami Karimi")).toBeInTheDocument();
		expect(screen.getByText("Kabul International School")).toBeInTheDocument();
	});
});

describe("StudentCertificatesTable", () => {
	it("shows the empty state when no certificate was issued", () => {
		render(<StudentCertificatesTable certificates={[]} />);
		expect(screen.getByText("empty.noCertificates")).toBeInTheDocument();
	});

	it("lists issued certificates", () => {
		render(
			<StudentCertificatesTable
				certificates={[
					{
						id: "cert1",
						course_title: "Algebra I",
						course_id: "c1",
						issued_at: "2026-03-01T00:00:00Z",
						verification_code: "ABC-123",
						certificate_pdf_url: null,
					},
				]}
			/>
		);

		expect(screen.getByText("Algebra I")).toBeInTheDocument();
		expect(screen.getByText("ABC-123")).toBeInTheDocument();
	});
});

describe("StudentActivityTimeline", () => {
	it("shows the empty state when there is no activity", () => {
		render(<StudentActivityTimeline activity={[]} />);
		expect(screen.getByText("empty.noActivity")).toBeInTheDocument();
	});

	it("renders each activity entry with its label and type", () => {
		render(
			<StudentActivityTimeline
				activity={[
					{
						type: "enrollment",
						label: "Enrolled in Algebra I",
						ts: "2026-01-10T00:00:00Z",
						meta: {},
					},
					{
						type: "quiz_attempt",
						label: "Quiz attempt: Algebra Midterm",
						ts: "2026-02-01T00:00:00Z",
						meta: { score: 18, passed: true },
					},
				]}
			/>
		);

		expect(screen.getByText("Enrolled in Algebra I")).toBeInTheDocument();
		expect(
			screen.getByText("Quiz attempt: Algebra Midterm")
		).toBeInTheDocument();
		expect(screen.getByText("activityTypes.enrollment")).toBeInTheDocument();
		expect(screen.getByText("activityTypes.quiz_attempt")).toBeInTheDocument();
	});
});

describe("StudentSummaryCards", () => {
	it("renders the academic and activity summaries", () => {
		render(<StudentSummaryCards overview={makeOverview()} />);

		expect(screen.getByText("academicSummary")).toBeInTheDocument();
		expect(screen.getByText("activitySummary")).toBeInTheDocument();
		expect(screen.getByText("summary.grades")).toBeInTheDocument();
		expect(screen.getByText("summary.subjects")).toBeInTheDocument();
		expect(screen.getByText("summary.bestScore")).toBeInTheDocument();
		// 95% — the best quiz score.
		expect(screen.getByText("95%")).toBeInTheDocument();
	});
});
