import { describe, expect, it } from "vitest";

import {
	bucketByMonth,
	computeAttendance,
	computeQuizPassStats,
	computeResultStats,
} from "@/components/blocks/school/school-report-utils";

describe("computeResultStats", () => {
	it("returns zeros for an empty sample", () => {
		expect(computeResultStats([])).toEqual({
			total: 0,
			completed: 0,
			passed: 0,
			failed: 0,
			passRate: 0,
			avgScorePct: 0,
		});
	});

	it("computes pass rate and weighted average score percentage", () => {
		const stats = computeResultStats([
			{ score: 80, max_score_possible: 100, passed: true },
			{ score: 30, max_score_possible: 50, passed: false },
			{ score: null, max_score_possible: null, passed: null },
		]);
		expect(stats.total).toBe(3);
		expect(stats.completed).toBe(2);
		expect(stats.passed).toBe(1);
		expect(stats.failed).toBe(1);
		expect(stats.passRate).toBe(50);
		// (80 + 30) / (100 + 50) = 73.333… → 73.3
		expect(stats.avgScorePct).toBe(73.3);
	});
});

describe("computeAttendance", () => {
	const registrations = [
		{ quiz_id: "q1", student_id: "s1", created_at: "2026-01-01" },
		{ quiz_id: "q2", student_id: "s1", created_at: "2026-01-02" },
		{ quiz_id: "q1", student_id: "s2", created_at: "2026-01-03" },
	];
	const attempts = [
		{
			quiz_id: "q1",
			user_id: "s1",
			completed_at: "2026-01-05",
			created_at: "2026-01-05",
		},
		{
			quiz_id: "q1",
			user_id: "s2",
			completed_at: null,
			created_at: "2026-01-05",
		},
		{
			quiz_id: "q3",
			user_id: "s9",
			completed_at: null,
			created_at: "2026-01-05",
		},
	];

	it("matches registrations against attempts per quiz+student", () => {
		const summary = computeAttendance(registrations, attempts);
		expect(summary.totalRegistered).toBe(3);
		expect(summary.totalAttended).toBe(2);
		expect(summary.rate).toBe(67);

		const s1 = summary.perStudent.find((row) => row.studentId === "s1");
		expect(s1).toMatchObject({ registered: 2, attended: 1, rate: 50 });

		const q1 = summary.perQuiz.find((row) => row.quizId === "q1");
		expect(q1).toMatchObject({ registered: 2, attended: 2, rate: 100 });

		const q2 = summary.perQuiz.find((row) => row.quizId === "q2");
		expect(q2).toMatchObject({ registered: 1, attended: 0, rate: 0 });
	});

	it("ignores attempts without a quiz and attaches last activity", () => {
		const summary = computeAttendance(registrations, attempts, {
			s1: "2026-02-01T00:00:00Z",
		});
		const s1 = summary.perStudent.find((row) => row.studentId === "s1");
		expect(s1?.lastActivity).toBe("2026-02-01T00:00:00Z");
	});

	it("handles an empty report", () => {
		const summary = computeAttendance([], []);
		expect(summary.totalRegistered).toBe(0);
		expect(summary.rate).toBe(0);
		expect(summary.perStudent).toEqual([]);
	});
});

describe("bucketByMonth", () => {
	it("buckets dates into the last N calendar months", () => {
		const now = new Date("2026-06-15T12:00:00Z");
		const points = bucketByMonth(
			[
				"2026-06-01T12:00:00Z",
				"2026-06-10T12:00:00Z",
				"2026-05-20T12:00:00Z",
				"2025-12-01T12:00:00Z", // outside the window
				null,
				"not-a-date",
			],
			6,
			now
		);
		expect(points.map((p) => p.date)).toEqual([
			"2026-01",
			"2026-02",
			"2026-03",
			"2026-04",
			"2026-05",
			"2026-06",
		]);
		expect(points.map((p) => p.value)).toEqual([0, 0, 0, 0, 1, 2]);
	});
});

describe("computeQuizPassStats", () => {
	it("ranks quizzes by attempts with pass rates", () => {
		const stats = computeQuizPassStats([
			{ quiz_id: "q1", passed: true, quiz: { title: "آزمون ریاضی" } },
			{ quiz_id: "q1", passed: false, quiz: { title: "آزمون ریاضی" } },
			{ quiz_id: "q2", passed: true, quiz: { title: "آزمون فیزیک" } },
			{ quiz_id: null, passed: true, quiz: null },
		]);
		expect(stats).toHaveLength(2);
		expect(stats[0]).toMatchObject({
			quizId: "q1",
			title: "آزمون ریاضی",
			attempts: 2,
			passed: 1,
			passRate: 50,
		});
		expect(stats[1]).toMatchObject({ quizId: "q2", passRate: 100 });
	});
});
