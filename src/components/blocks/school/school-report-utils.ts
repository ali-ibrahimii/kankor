/**
 * Pure aggregation helpers for the school results / attendance / analytics
 * pages — kept side-effect free so the math is unit-testable.
 */

export type ResultStatRow = {
	score: number | null;
	max_score_possible: number | null;
	passed: boolean | null;
};

export type ResultStats = {
	total: number;
	completed: number;
	passed: number;
	failed: number;
	passRate: number;
	avgScorePct: number;
};

/** Aggregate attempts into the summary strip above the results table. */
export function computeResultStats(
	rows: readonly ResultStatRow[]
): ResultStats {
	let completed = 0;
	let passed = 0;
	let scoreSum = 0;
	let scoreWeight = 0;

	for (const row of rows) {
		if (row.passed === true) passed += 1;
		if (row.passed !== null) completed += 1;
		if (row.score != null && (row.max_score_possible ?? 0) > 0) {
			scoreSum += row.score;
			scoreWeight += row.max_score_possible ?? 0;
		}
	}

	return {
		total: rows.length,
		completed,
		passed,
		failed: completed - passed,
		passRate: completed > 0 ? Math.round((passed / completed) * 1000) / 10 : 0,
		avgScorePct:
			scoreWeight > 0 ? Math.round((scoreSum / scoreWeight) * 1000) / 10 : 0,
	};
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceRegistration = {
	quiz_id: string;
	student_id: string;
	created_at: string;
};

export type AttendanceAttempt = {
	quiz_id: string | null;
	user_id: string;
	completed_at: string | null;
	created_at: string;
};

export type StudentAttendance = {
	studentId: string;
	registered: number;
	attended: number;
	rate: number;
	lastActivity: string | null;
};

export type QuizAttendance = {
	quizId: string;
	registered: number;
	attended: number;
	rate: number;
};

export type AttendanceSummary = {
	perStudent: StudentAttendance[];
	perQuiz: QuizAttendance[];
	totalRegistered: number;
	totalAttended: number;
	rate: number;
};

/**
 * Exam attendance = registered students (`quiz_registrations`) versus those
 * who actually sat the exam (`quiz_attempts`). A student counts as attended
 * for a quiz when any attempt exists for that quiz.
 */
export function computeAttendance(
	registrations: readonly AttendanceRegistration[],
	attempts: readonly AttendanceAttempt[],
	lastActivityByStudent: Readonly<Record<string, string>> = {}
): AttendanceSummary {
	const attempted = new Set(
		attempts
			.filter((a) => a.quiz_id != null)
			.map((a) => `${a.quiz_id}::${a.user_id}`)
	);

	const students = new Map<string, { registered: number; attended: number }>();
	const quizzes = new Map<string, { registered: number; attended: number }>();

	for (const reg of registrations) {
		const didAttend = attempted.has(`${reg.quiz_id}::${reg.student_id}`);

		const student = students.get(reg.student_id) ?? {
			registered: 0,
			attended: 0,
		};
		student.registered += 1;
		if (didAttend) student.attended += 1;
		students.set(reg.student_id, student);

		const quiz = quizzes.get(reg.quiz_id) ?? { registered: 0, attended: 0 };
		quiz.registered += 1;
		if (didAttend) quiz.attended += 1;
		quizzes.set(reg.quiz_id, quiz);
	}

	const perStudent: StudentAttendance[] = [...students.entries()].map(
		([studentId, s]) => ({
			studentId,
			registered: s.registered,
			attended: s.attended,
			rate:
				s.registered > 0 ? Math.round((s.attended / s.registered) * 100) : 0,
			lastActivity: lastActivityByStudent[studentId] ?? null,
		})
	);
	perStudent.sort((a, b) => a.rate - b.rate);

	const perQuiz: QuizAttendance[] = [...quizzes.entries()].map(
		([quizId, q]) => ({
			quizId,
			registered: q.registered,
			attended: q.attended,
			rate:
				q.registered > 0 ? Math.round((q.attended / q.registered) * 100) : 0,
		})
	);

	const totalRegistered = registrations.length;
	const totalAttended = perStudent.reduce((sum, s) => sum + s.attended, 0);

	return {
		perStudent,
		perQuiz,
		totalRegistered,
		totalAttended,
		rate:
			totalRegistered > 0
				? Math.round((totalAttended / totalRegistered) * 100)
				: 0,
	};
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type MonthlyPoint = { date: string; value: number };

/**
 * Bucket rows into the last `months` calendar months (oldest first), keyed
 * `YYYY-MM` and labeled for TrendChart (`{ date, value }`).
 */
export function bucketByMonth(
	dates: readonly (string | null)[],
	months: number,
	now: Date = new Date()
): MonthlyPoint[] {
	const counts = new Map<string, number>();
	const keys: string[] = [];

	for (let i = months - 1; i >= 0; i -= 1) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		keys.push(key);
		counts.set(key, 0);
	}

	for (const raw of dates) {
		if (!raw) continue;
		const d = new Date(raw);
		if (Number.isNaN(d.getTime())) continue;
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return keys.map((key) => ({ date: key, value: counts.get(key) ?? 0 }));
}

export type QuizPassStat = {
	quizId: string;
	title: string;
	attempts: number;
	passed: number;
	passRate: number;
};

/** Per-quiz pass-rate ranking for the analytics page. */
export function computeQuizPassStats(
	rows: readonly {
		quiz_id: string | null;
		passed: boolean | null;
		quiz: { title: string } | null;
	}[]
): QuizPassStat[] {
	const byQuiz = new Map<
		string,
		{ title: string; attempts: number; passed: number }
	>();

	for (const row of rows) {
		if (!row.quiz_id) continue;
		const entry = byQuiz.get(row.quiz_id) ?? {
			title: row.quiz?.title ?? row.quiz_id,
			attempts: 0,
			passed: 0,
		};
		entry.attempts += 1;
		if (row.passed === true) entry.passed += 1;
		byQuiz.set(row.quiz_id, entry);
	}

	return [...byQuiz.entries()]
		.map(([quizId, e]) => ({
			quizId,
			title: e.title,
			attempts: e.attempts,
			passed: e.passed,
			passRate: e.attempts > 0 ? Math.round((e.passed / e.attempts) * 100) : 0,
		}))
		.sort((a, b) => b.attempts - a.attempts);
}
