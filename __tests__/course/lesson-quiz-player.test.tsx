import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	LessonQuizPlayer,
	type LessonQuizState,
	type SubmitLessonQuizResult,
} from "@/components/blocks/course/lesson-quiz-player";
import enMessages from "@/messages/en.json";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		rpc: (...args: unknown[]) => mockRpc(...args),
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

function renderWithProviders(ui: ReactNode) {
	const qc = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={qc}>
			<NextIntlClientProvider locale="en" messages={enMessages}>
				{ui}
			</NextIntlClientProvider>
		</QueryClientProvider>
	);
}

function baseState(overrides: Partial<LessonQuizState> = {}): LessonQuizState {
	return {
		quiz: {
			id: "quiz-1",
			title: "Chapter 1 Final Exam",
			description: "Covers lessons 1–4",
			instructions: "Choose the single best option.",
			time_limit_minutes: 15,
			max_attempts: 3,
			passing_score_percentage: 70,
			shuffle_questions: false,
			show_correct_answers_after: "attempt",
			question_count: 1,
			total_points: 2,
		},
		has_passed: false,
		attempts_used: 0,
		remaining_attempts: 3,
		can_start: true,
		attempts: [],
		active_attempt: null,
		...overrides,
	};
}

beforeEach(() => {
	mockRpc.mockReset();
});

describe("LessonQuizPlayer", () => {
	it("loads quiz overview, starts an attempt, submits answers, and notifies onQuizPassed when passed", async () => {
		const onQuizPassed = vi.fn();
		const activeState = baseState({
			active_attempt: {
				id: "att-1",
				attempt_number: 1,
				started_at: new Date().toISOString(),
				expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
				max_score_possible: 2,
				questions: [
					{
						id: "q-1",
						question_text: "What is 6 × 7?",
						question_type: "multiple_choice_single_correct",
						order_index: 0,
						points: 2,
						hint: "Think 42",
						image_url: null,
						allow_multiple: false,
						blank_count: 0,
						match_targets: [],
						options: [
							{ id: "opt-a", option_text: "36", order_index: 0 },
							{ id: "opt-b", option_text: "42", order_index: 1 },
						],
					},
				],
			},
		});

		const passedState = baseState({
			has_passed: true,
			attempts_used: 1,
			remaining_attempts: 2,
			can_start: true,
			attempts: [
				{
					id: "att-1",
					attempt_number: 1,
					score: 2,
					max_score_possible: 2,
					passed: true,
					started_at: new Date().toISOString(),
					completed_at: new Date().toISOString(),
					awaiting_manual_grade: false,
				},
			],
		});

		const submitPayload: SubmitLessonQuizResult = {
			attempt: {
				id: "att-1",
				attempt_number: 1,
				score: 2,
				max_score_possible: 2,
				score_percentage: 100,
				passing_score_percentage: 70,
				passed: true,
				awaiting_manual_grade: false,
				completed_at: new Date().toISOString(),
			},
			lesson_completed: true,
			show_answers: true,
			review: [
				{
					question_id: "q-1",
					question_text: "What is 6 × 7?",
					question_type: "multiple_choice_single_correct",
					points: 2,
					points_awarded: 2,
					is_correct: true,
					explanation: "6 times 7 equals 42.",
					feedback: null,
					selected_option_ids: ["opt-b"],
					answer_text: null,
					structured_answer: null,
					options: [
						{
							id: "opt-a",
							option_text: "36",
							is_correct: false,
							feedback: null,
							match_target_text: null,
							order_index: 0,
						},
						{
							id: "opt-b",
							option_text: "42",
							is_correct: true,
							feedback: null,
							match_target_text: null,
							order_index: 1,
						},
					],
				},
			],
			state: passedState,
		};

		mockRpc.mockImplementation(async (fn: string) => {
			if (fn === "get_lesson_quiz_state") {
				return { data: baseState(), error: null };
			}
			if (fn === "start_lesson_quiz_attempt") {
				return { data: activeState, error: null };
			}
			if (fn === "submit_lesson_quiz_attempt") {
				return { data: submitPayload, error: null };
			}
			return { data: null, error: null };
		});

		renderWithProviders(
			<LessonQuizPlayer
				lessonId="lesson-1"
				quizId="quiz-1"
				note="Review chapter 1 before starting."
				onQuizPassed={onQuizPassed}
			/>
		);

		expect(await screen.findByText("Chapter 1 Final Exam")).toBeInTheDocument();
		expect(
			screen.getByText("Review chapter 1 before starting.")
		).toBeInTheDocument();
		expect(screen.getByText("Passing score: 70%")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));
		expect(await screen.findByText("What is 6 × 7?")).toBeInTheDocument();

		// Clicking Submit with 0 answered shows confirmation prompt first
		fireEvent.click(screen.getByRole("button", { name: /Submit Exam/i }));
		expect(screen.getByText(/unanswered questions/i)).toBeInTheDocument();

		// Pick option 42 and submit
		fireEvent.click(screen.getByRole("button", { name: "42" }));
		fireEvent.click(screen.getByRole("button", { name: /Submit Exam/i }));

		await waitFor(() => expect(onQuizPassed).toHaveBeenCalledTimes(1));
		expect(mockRpc).toHaveBeenCalledWith("submit_lesson_quiz_attempt", {
			p_attempt_id: "att-1",
			p_lesson_id: "lesson-1",
			p_answers: [{ question_id: "q-1", selected_option_ids: ["opt-b"] }],
		});
		expect(
			await screen.findByText("You passed this exam!")
		).toBeInTheDocument();
		expect(screen.getByText("6 times 7 equals 42.")).toBeInTheDocument();
	});

	it("does not trigger onQuizPassed on a failing attempt and allows retaking", async () => {
		const onQuizPassed = vi.fn();
		const failedState = baseState({
			has_passed: false,
			attempts_used: 1,
			remaining_attempts: 2,
			can_start: true,
			attempts: [
				{
					id: "att-1",
					attempt_number: 1,
					score: 0,
					max_score_possible: 2,
					passed: false,
					started_at: new Date().toISOString(),
					completed_at: new Date().toISOString(),
					awaiting_manual_grade: false,
				},
			],
		});

		mockRpc.mockResolvedValue({ data: failedState, error: null });

		renderWithProviders(
			<LessonQuizPlayer
				lessonId="lesson-1"
				quizId="quiz-1"
				onQuizPassed={onQuizPassed}
			/>
		);

		expect(
			await screen.findByRole("button", { name: /Retake Exam/i })
		).toBeInTheDocument();
		expect(screen.getByText("2 attempts remaining")).toBeInTheDocument();
		expect(screen.getByText("Not passed")).toBeInTheDocument();
		expect(onQuizPassed).not.toHaveBeenCalled();
	});

	it("shows exhausted attempts message when max_attempts is reached without passing", async () => {
		mockRpc.mockResolvedValue({
			data: baseState({
				has_passed: false,
				attempts_used: 3,
				remaining_attempts: 0,
				can_start: false,
			}),
			error: null,
		});

		renderWithProviders(
			<LessonQuizPlayer lessonId="lesson-1" quizId="quiz-1" />
		);

		expect(
			await screen.findByText(enMessages.courses.learn.quiz.noAttemptsLeft)
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Start Exam|Retake Exam/i })
		).not.toBeInTheDocument();
	});
});
