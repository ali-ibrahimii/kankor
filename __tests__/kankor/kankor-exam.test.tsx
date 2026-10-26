import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KankorExam } from "@/app/[locale]/d/(student)/tests/kankor/_components/kankor-exam";
import {
	buildKankorExam,
	EXAM_MINUTES,
	gradeExam,
	scoreBand,
} from "@/app/[locale]/d/(student)/tests/kankor/_data/kankor-exam";
import faMessages from "@/messages/fa.json";

vi.mock("@/i18n/navigation", () => ({
	Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

const raw = (faMessages as { content: { kankorExam: { questions: unknown } } })
	.content.kankorExam.questions;

const exam = buildKankorExam(raw);

const withIntl = (node: React.ReactNode) => (
	<NextIntlClientProvider locale="fa" messages={faMessages}>
		{node}
	</NextIntlClientProvider>
);

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("kankor exam data", () => {
	it("builds a general paper covering every Kankor subject", () => {
		expect(exam.questions).toHaveLength(16);
		expect(exam.sections).toHaveLength(8);
		expect(exam.minutes).toBe(EXAM_MINUTES);
		for (const section of exam.sections) {
			expect(section.questions).toHaveLength(2);
			for (const question of section.questions) {
				expect(question.options).toHaveLength(4);
				expect(question.correct).toBeGreaterThanOrEqual(0);
				expect(question.correct).toBeLessThan(4);
			}
		}
	});

	it("drops malformed questions instead of rendering them", () => {
		const built = buildKankorExam([
			{
				id: "ok",
				subject: "math",
				stem: "1+1",
				options: ["2", "3", "4", "5"],
				correct: 0,
			},
			{ id: "no-subject", stem: "?", options: ["a", "b"], correct: 0 },
			{
				id: "bad-subject",
				subject: "history",
				stem: "?",
				options: ["a", "b"],
				correct: 0,
			},
			{
				id: "bad-index",
				subject: "math",
				stem: "?",
				options: ["a", "b"],
				correct: 5,
			},
			{
				id: "one-option",
				subject: "math",
				stem: "?",
				options: ["a"],
				correct: 0,
			},
		]);

		expect(built.questions.map((question) => question.id)).toEqual(["ok"]);
		expect(built.sections).toHaveLength(1);
	});
});

describe("kankor grading", () => {
	it("counts correct, wrong and blank answers with no negative marking", () => {
		const answers = Object.fromEntries(
			exam.questions
				.slice(0, 10)
				.map((question, index) => [
					question.id,
					index < 6 ? question.correct : (question.correct + 1) % 4,
				])
		);

		const result = gradeExam(exam, answers);

		expect(result.total).toBe(16);
		expect(result.correct).toBe(6);
		expect(result.wrong).toBe(4);
		expect(result.blank).toBe(6);
		expect(result.answered).toBe(10);
		expect(result.percent).toBe(38);
		expect(result.perSubject).toHaveLength(8);
		expect(
			result.perSubject.reduce((sum, subject) => sum + subject.total, 0)
		).toBe(16);
	});

	it("gives a full mark result when every answer is right", () => {
		const answers = Object.fromEntries(
			exam.questions.map((question) => [question.id, question.correct])
		);
		const result = gradeExam(exam, answers);

		expect(result.percent).toBe(100);
		expect(result.wrong).toBe(0);
		expect(result.blank).toBe(0);
		expect(scoreBand(result.percent)).toBe("excellent");
	});

	it("bands the score the way the result screen labels it", () => {
		expect(scoreBand(85)).toBe("excellent");
		expect(scoreBand(61)).toBe("good");
		expect(scoreBand(45)).toBe("average");
		expect(scoreBand(12)).toBe("weak");
	});
});

describe("kankor exam page", () => {
	it("shows the rules before the timer starts", () => {
		render(withIntl(<KankorExam exam={exam} />));

		expect(
			screen.getByRole("heading", { name: /آماده‌ای؟/ })
		).toBeInTheDocument();
		expect(screen.getByText("قواعد آزمون")).toBeInTheDocument();
		expect(
			screen.getByText(/کانکور عمومی افغانستان ۱۶۰ سوال/)
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /شروع آزمون/ })
		).toBeInTheDocument();
		// One question at a time — nothing is asked yet.
		expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
	});

	it("runs the exam question by question and grades the finished paper", () => {
		render(withIntl(<KankorExam exam={exam} />));
		fireEvent.click(screen.getByRole("button", { name: /شروع آزمون/ }));

		expect(screen.getByText(/سوال ۱ از ۱۶/)).toBeInTheDocument();
		expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		expect(screen.getAllByRole("radio")).toHaveLength(4);

		// Answer the first question correctly through the option button.
		const first = exam.questions[0];
		const option = screen.getAllByRole("radio")[first.correct];
		expect(option).toHaveTextContent(first.options[first.correct]);
		fireEvent.click(option);
		expect(screen.getAllByRole("radio")[first.correct]).toHaveAttribute(
			"aria-checked",
			"true"
		);

		// Flag it, then move on.
		fireEvent.click(screen.getByRole("button", { name: /علامت‌گذاری/ }));
		expect(
			screen.getByRole("button", { name: /علامت‌خورده/ })
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /سوال بعدی/ }));
		expect(screen.getByText(/سوال ۲ از ۱۶/)).toBeInTheDocument();

		// Finishing asks for confirmation and mentions the blanks.
		fireEvent.click(screen.getByRole("button", { name: /پایان آزمون/ }));
		expect(screen.getByText(/۱۵ سوال بی‌پاسخ مانده است/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /تصحیح کن/ }));

		expect(screen.getByText("نتیجهٔ آزمون آزمایشی")).toBeInTheDocument();
		expect(screen.getByText("نتیجهٔ هر مضمون")).toBeInTheDocument();
		// 1 correct out of 16 → 6%, shown with locale digits.
		expect(screen.getByText("۶%")).toBeInTheDocument();
		expect(localStorage.getItem("kankor-mock-exam-v1")).toBeNull();
	});

	it("auto-submits when the countdown reaches zero", () => {
		vi.useFakeTimers();
		render(withIntl(<KankorExam exam={exam} />));
		fireEvent.click(screen.getByRole("button", { name: /شروع آزمون/ }));

		expect(screen.queryByText("زمان آزمون تمام شد")).not.toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(exam.minutes * 60_000 + 2000);
		});

		expect(screen.getByText("زمان آزمون تمام شد")).toBeInTheDocument();
		expect(screen.getByText(/پاسخ‌های ثبت‌شده تصحیح شدند/)).toBeInTheDocument();
		expect(screen.getByText("نتیجهٔ آزمون آزمایشی")).toBeInTheDocument();
	});

	it("keeps the attempt in localStorage so a refresh can resume it", () => {
		render(withIntl(<KankorExam exam={exam} />));
		fireEvent.click(screen.getByRole("button", { name: /شروع آزمون/ }));

		const first = exam.questions[0];
		fireEvent.click(screen.getAllByRole("radio")[first.correct]);

		const stored = JSON.parse(
			localStorage.getItem("kankor-mock-exam-v1") ?? "{}"
		);
		expect(stored.answers[first.id]).toBe(first.correct);
		expect(stored.questionCount).toBe(16);
	});

	it("leaves the exam only after the exit confirmation", () => {
		render(withIntl(<KankorExam exam={exam} />));
		fireEvent.click(screen.getByRole("button", { name: /شروع آزمون/ }));

		fireEvent.click(screen.getByRole("button", { name: /خروج/ }));
		expect(screen.getByText("آزمون را رها می‌کنی؟")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /بله، خارج شو/ }));

		expect(
			screen.getByRole("button", { name: /شروع آزمون/ })
		).toBeInTheDocument();
		expect(localStorage.getItem("kankor-mock-exam-v1")).toBeNull();
	});
});
