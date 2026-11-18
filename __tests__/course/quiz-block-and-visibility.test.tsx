import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createStore, Provider as JotaiProvider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizBlockField } from "@/components/blocks/course-builder/quiz-block-field";
import { courseBuilderAtom } from "@/components/blocks/course-builder/store";
import {
	ADDABLE_BLOCK_TYPES,
	createEmptyBlock,
	createEmptyLesson,
	deriveLessonContentType,
	type ResolvedQuizSummary,
} from "@/components/blocks/course-builder/types";
import {
	formValuesToQuizPatch,
	quizDraftToFormValues,
} from "@/components/blocks/quiz-builder/types";
import enMessages from "@/messages/en.json";
import faMessages from "@/messages/fa.json";
import psMessages from "@/messages/ps.json";

const mockResolveQuizForBlock = vi.fn();
const mockGetQuizSummaryForBlock = vi.fn();
const mockListAttachableQuizzesForCourse = vi.fn();

vi.mock("@/components/blocks/course-builder/actions", () => ({
	resolveQuizForBlock: (...args: unknown[]) => mockResolveQuizForBlock(...args),
	getQuizSummaryForBlock: (...args: unknown[]) =>
		mockGetQuizSummaryForBlock(...args),
	listAttachableQuizzesForCourse: (...args: unknown[]) =>
		mockListAttachableQuizzesForCourse(...args),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const sampleQuiz: ResolvedQuizSummary = {
	id: "quiz-uuid-1",
	title: "امتحان آخر فصل اول",
	description: "سوالات چهارگزینه‌ای فصل اول",
	entrance_code: "C61F0662",
	slug: "chapter-1-final",
	visibility: "private",
	course_id: null,
	course_title: null,
	question_count: 10,
	passing_score_percentage: 75,
	time_limit_minutes: 20,
	max_attempts: 2,
	shuffle_questions: true,
	show_correct_answers_after: "attempt",
};

function renderQuizBlockField() {
	const store = createStore();
	const lesson = createEmptyLesson("mod-1", "course-1", 0);
	const block = createEmptyBlock(lesson.id, "course-1", "quiz", 0);

	store.set(courseBuilderAtom, {
		courseId: "course-1",
		activeLessonId: lesson.id,
		activeBlockId: block.id,
		modules: [],
		lessons: [lesson],
		blocks: [block],
		isSaving: false,
		isPublishing: false,
		expandedModuleIds: new Set(["mod-1"]),
	});

	const qc = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	const LiveWrapper = () => {
		const current = store
			.get(courseBuilderAtom)
			.blocks.find((b) => b.id === block.id)!;
		return <QuizBlockField block={current} />;
	};

	const utils = render(
		<JotaiProvider store={store}>
			<QueryClientProvider client={qc}>
				<NextIntlClientProvider locale="fa" messages={faMessages}>
					<LiveWrapper />
				</NextIntlClientProvider>
			</QueryClientProvider>
		</JotaiProvider>
	);

	return {
		store,
		blockId: block.id,
		rerender: () =>
			utils.rerender(
				<JotaiProvider store={store}>
					<QueryClientProvider client={qc}>
						<NextIntlClientProvider locale="fa" messages={faMessages}>
							<LiveWrapper />
						</NextIntlClientProvider>
					</QueryClientProvider>
				</JotaiProvider>
			),
	};
}

beforeEach(() => {
	mockResolveQuizForBlock.mockReset();
	mockGetQuizSummaryForBlock.mockReset();
	mockListAttachableQuizzesForCourse.mockReset();
	mockListAttachableQuizzesForCourse.mockResolvedValue([]);
});

describe("Course builder quiz block & quiz visibility settings", () => {
	it("exposes quiz in ADDABLE_BLOCK_TYPES and prioritizes quiz over text", () => {
		expect(ADDABLE_BLOCK_TYPES).toContain("quiz");
		const lesson = createEmptyLesson("mod-1", "course-1", 0);
		const textBlock = createEmptyBlock(lesson.id, "course-1", "text", 0);
		const quizBlock = createEmptyBlock(lesson.id, "course-1", "quiz", 1);
		expect(deriveLessonContentType(lesson, [textBlock, quizBlock])).toBe(
			"quiz"
		);
	});

	it("attaches a course-only quiz by entrance code and renders its metadata card", async () => {
		mockResolveQuizForBlock.mockResolvedValue({
			success: true,
			data: sampleQuiz,
		});
		mockGetQuizSummaryForBlock.mockResolvedValue(sampleQuiz);

		const { store, blockId, rerender } = renderQuizBlockField();

		const input = screen.getByLabelText(
			faMessages.courseBuilder.block.quiz.inputLabel
		);
		fireEvent.change(input, { target: { value: "C61F0662" } });
		fireEvent.click(
			screen.getByRole("button", {
				name: faMessages.courseBuilder.block.quiz.attachButton,
			})
		);

		await waitFor(() =>
			expect(mockResolveQuizForBlock).toHaveBeenCalledWith(
				"course-1",
				"C61F0662"
			)
		);
		expect(
			store.get(courseBuilderAtom).blocks.find((b) => b.id === blockId)?.quiz_id
		).toBe("quiz-uuid-1");

		rerender();
		expect(await screen.findByText("امتحان آخر فصل اول")).toBeInTheDocument();
		expect(
			screen.getByText(faMessages.courseBuilder.block.quiz.courseOnlyBadge)
		).toBeInTheDocument();
		expect(screen.getByText("C61F0662")).toBeInTheDocument();
	});

	it("shows a localized error when a quiz belongs to another course", async () => {
		mockResolveQuizForBlock.mockResolvedValue({
			success: false,
			code: "bound_to_other_course",
			error: "quiz_bound_to_other_course",
		});

		renderQuizBlockField();

		const input = screen.getByLabelText(
			faMessages.courseBuilder.block.quiz.inputLabel
		);
		fireEvent.change(input, { target: { value: "F935D2BC" } });
		fireEvent.click(
			screen.getByRole("button", {
				name: faMessages.courseBuilder.block.quiz.attachButton,
			})
		);

		expect(
			await screen.findByText(
				faMessages.courseBuilder.block.quiz.errors.boundToOtherCourse
			)
		).toBeInTheDocument();
	});

	it("maps course-only visibility and associated course cleanly in QuizSettingsValues", () => {
		const defaults = quizDraftToFormValues();
		expect(defaults.visibility).toBe("public");
		expect(defaults.course_id).toBeNull();

		// Course-only with selected course forces free pricing and preserves course_id
		const privatePatch = formValuesToQuizPatch({
			...defaults,
			title: "End of Chapter 1",
			visibility: "private",
			course_id: "course-99",
			is_free: false,
			price_credits: "50",
		});
		expect(privatePatch.visibility).toBe("private");
		expect(privatePatch.course_id).toBe("course-99");
		expect(privatePatch.is_free).toBe(true);
		expect(privatePatch.price_credits).toBe(0);

		// Course-only without course (attach via quiz code in any course)
		const codeOnlyPatch = formValuesToQuizPatch({
			...defaults,
			title: "Code-only Exam",
			visibility: "private",
			course_id: null,
		});
		expect(codeOnlyPatch.visibility).toBe("private");
		expect(codeOnlyPatch.course_id).toBeNull();

		// Switching back to public always clears course_id
		const publicPatch = formValuesToQuizPatch({
			...defaults,
			title: "Public Mock Exam",
			visibility: "public",
			course_id: "course-99",
			is_free: false,
			price_credits: "25",
		});
		expect(publicPatch.visibility).toBe("public");
		expect(publicPatch.course_id).toBeNull();
		expect(publicPatch.is_free).toBe(false);
		expect(publicPatch.price_credits).toBe(25);
	});

	it("keeps complete en/fa/ps translation parity for all new quiz block, gating, and visibility keys", () => {
		function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
			return Object.entries(obj)
				.flatMap(([k, v]) => {
					const path = prefix ? `${prefix}.${k}` : k;
					return v && typeof v === "object" && !Array.isArray(v)
						? collectKeys(v as Record<string, unknown>, path)
						: [path];
				})
				.sort();
		}

		for (const section of [
			(m: typeof enMessages) => m.courseBuilder.block.quiz,
			(m: typeof enMessages) => m.quizBuilder.settings,
			(m: typeof enMessages) => m.quizBuilder.list.table,
			(m: typeof enMessages) => m.courses.learn.quiz,
			(m: typeof enMessages) => m.courses.detail,
		]) {
			const enKeys = collectKeys(section(enMessages));
			expect(collectKeys(section(faMessages))).toEqual(enKeys);
			expect(collectKeys(section(psMessages))).toEqual(enKeys);
		}
	});
});
