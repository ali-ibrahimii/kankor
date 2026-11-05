import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Renders the admin student *detail page* — the server component the admin
 * actually navigates to — against a mocked data layer.
 *
 * This covers the wiring between the page and the data access module:
 * if the page stopped passing the enrollments / attempts / decks through to
 * the tables, these assertions would fail even though the individual panels
 * still render correctly on their own.
 */

const mockGetProfile = vi.hoisted(() => vi.fn());
const mockGetOverview = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
	notFound: () => {
		const error = new Error("NEXT_NOT_FOUND");
		(error as { digest?: string }).digest = "NEXT_NOT_FOUND";
		throw error;
	},
}));

vi.mock("@/lib/data/admin-students", () => ({
	getAdminStudentProfile: mockGetProfile,
	getAdminStudentOverview: mockGetOverview,
}));

vi.mock("@/components/blocks/credits", () => ({
	getCreditLedger: vi.fn(async () => ({ success: true, data: [] })),
	getPurchaseHistory: vi.fn(async () => ({ success: true, data: [] })),
	StudentLedgerView: () => <div data-testid="ledger-view" />,
}));

vi.mock("@/components/blocks/admin", () => ({
	EntityDetailHeader: ({ title }: { title: string }) => (
		<div data-testid="detail-header">{title}</div>
	),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
	setRequestLocale: vi.fn(),
}));

// The client components under the page read translations through
// next-intl's client provider, so the tree needs one.
vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/routes", () => ({
	routes: {
		d: {
			admin: {
				users: {
					students: {
						page: () => "/en/d/admin/users/students",
					},
				},
			},
		},
	},
}));

const PROFILE = {
	id: "aaaaaaaa-0000-0000-0000-000000000001",
	full_name: "Amina Kabuli",
	email: "amina@example.com",
	phone: "+93 700 000 000",
	avatar_url: null,
	bio: "Hardworking student.",
	credit_balance: 120,
	student_status: "active" as const,
	province_id: "p1",
	created_at: "2026-01-01T00:00:00Z",
	updated_at: null,
	province_name: "Kabul",
};

const OVERVIEW = {
	enrolled_courses_count: 2,
	completed_courses_count: 1,
	in_progress_courses_count: 1,
	active_decks_count: 1,
	quiz_attempts_count: 2,
	quizzes_passed_count: 1,
	quizzes_failed_count: 1,
	average_quiz_score: 55,
	best_quiz_score: 90,
	bookmarks_count: 3,
	notes_count: 2,
	certificates_count: 1,
	classrooms_count: 1,
	lessons_completed_count: 18,
	study_minutes_count: 320,
	distinct_grades_count: 2,
	distinct_subjects_count: 2,
	first_enrolled_at: "2026-01-10T00:00:00Z",
	last_activity_at: "2026-03-02T00:00:00Z",
	course_enrollments: [
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
			instructor_name: "Haji Noor",
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
	],
	quiz_attempts: [
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
			feedback_from_instructor: "Excellent",
			grade_name: "Grade 10",
			subject_name: "Mathematics",
		},
	],
	deck_progress: [
		{
			id: "d1",
			deck_id: "dk1",
			deck_name: "Chemistry Cards",
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
	],
	classrooms: [
		{
			id: "cl1",
			name: "Physics A",
			role: "student",
			joined_at: "2026-01-05T00:00:00Z",
			school_name: "Kabul International School",
			teacher_name: "Sami Karimi",
		},
	],
	certificates: [
		{
			id: "cert1",
			course_title: "Algebra I",
			course_id: "c1",
			issued_at: "2026-03-01T00:00:00Z",
			verification_code: "CERT-001",
			certificate_pdf_url: null,
		},
	],
	activity: [
		{
			type: "enrollment",
			label: "Enrolled in Algebra I",
			ts: "2026-01-10T00:00:00Z",
			meta: {},
		},
	],
};

async function renderPage() {
	const { default: Page } = await import("./page");
	return render(
		await Page({
			params: Promise.resolve({
				user_id: "aaaaaaaa-0000-0000-0000-000000000001",
				locale: "en",
			}),
		})
	);
}

describe("Admin student detail page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetProfile.mockResolvedValue(PROFILE);
		mockGetOverview.mockResolvedValue(OVERVIEW);
	});

	it("renders the student's identity", async () => {
		await renderPage();

		expect(mockGetProfile).toHaveBeenCalledWith(
			"aaaaaaaa-0000-0000-0000-000000000001"
		);
		expect(mockGetOverview).toHaveBeenCalledWith(
			"aaaaaaaa-0000-0000-0000-000000000001"
		);
		expect(screen.getByTestId("detail-header")).toHaveTextContent(
			"Amina Kabuli"
		);
	});

	it("shows the enrollments, quiz results, decks and classrooms", async () => {
		await renderPage();

		// Course enrollment (the "courses" tab).
		await userEvent.click(screen.getByRole("tab", { name: "tabs.courses" }));
		expect(screen.getByText("Algebra I")).toBeInTheDocument();
		expect(screen.getByText("Grade 10")).toBeInTheDocument();
		expect(screen.getByText("Haji Noor")).toBeInTheDocument();

		// Quiz attempt with its score (the "quizzes" tab).
		await userEvent.click(screen.getByRole("tab", { name: "tabs.quizzes" }));
		expect(screen.getByText("Algebra Midterm")).toBeInTheDocument();
		expect(screen.getByText("90%")).toBeInTheDocument();

		// Deck progress (the "decks" tab).
		await userEvent.click(screen.getByRole("tab", { name: "tabs.decks" }));
		expect(screen.getByText("Chemistry Cards")).toBeInTheDocument();
		expect(screen.getByText("20 / 50")).toBeInTheDocument();

		// Classroom and certificate (the "classrooms" tab).
		await userEvent.click(screen.getByRole("tab", { name: "tabs.classrooms" }));
		expect(screen.getByText("Physics A")).toBeInTheDocument();
		expect(screen.getByText("Sami Karimi")).toBeInTheDocument();
		expect(screen.getByText("CERT-001")).toBeInTheDocument();

		// Activity timeline (the "activity" tab).
		await userEvent.click(screen.getByRole("tab", { name: "tabs.activity" }));
		expect(screen.getByText("Enrolled in Algebra I")).toBeInTheDocument();
	});

	it("keeps the credit ledger tab wired up", async () => {
		await renderPage();

		await userEvent.click(screen.getByRole("tab", { name: "tabs.credits" }));
		expect(screen.getByTestId("ledger-view")).toBeInTheDocument();
	});

	it("throws a not-found error for a missing student", async () => {
		mockGetProfile.mockResolvedValue(null);

		await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
	});

	it("shows a fallback message when the overview is unavailable", async () => {
		mockGetOverview.mockResolvedValue(null);

		await renderPage();

		expect(screen.getByText("overviewUnavailable")).toBeInTheDocument();
		// The ledger is still available even without the overview.
		await userEvent.click(screen.getByRole("tab", { name: "tabs.credits" }));
		expect(screen.getByTestId("ledger-view")).toBeInTheDocument();
	});
});
