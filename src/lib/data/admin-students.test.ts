import { describe, expect, it } from "vitest";
import { normalizeStudentOverview } from "./admin-students";

/**
 * The admin student overview RPC returns its collections as `jsonb`, so the
 * app-side normaliser is the only thing standing between an unexpected
 * payload and a crash in the detail page. These tests pin down that
 * defensive behaviour.
 */

type RawRow = Parameters<typeof normalizeStudentOverview>[0];

function makeRow(
	overrides: Partial<NonNullable<RawRow>> = {}
): NonNullable<RawRow> {
	return {
		enrolled_courses_count: 0,
		completed_courses_count: 0,
		in_progress_courses_count: 0,
		active_decks_count: 0,
		quiz_attempts_count: 0,
		quizzes_passed_count: 0,
		quizzes_failed_count: 0,
		average_quiz_score: 0,
		best_quiz_score: 0,
		bookmarks_count: 0,
		notes_count: 0,
		certificates_count: 0,
		classrooms_count: 0,
		lessons_completed_count: 0,
		study_minutes_count: 0,
		distinct_grades_count: 0,
		distinct_subjects_count: 0,
		first_enrolled_at: null,
		last_activity_at: null,
		course_enrollments: [],
		quiz_attempts: [],
		deck_progress: [],
		classrooms: [],
		certificates: [],
		activity: [],
		...overrides,
	} as NonNullable<RawRow>;
}

describe("normalizeStudentOverview", () => {
	it("returns null for a missing row", () => {
		expect(normalizeStudentOverview(null)).toBeNull();
	});

	it("keeps the aggregate counters untouched", () => {
		const result = normalizeStudentOverview(
			makeRow({
				enrolled_courses_count: 4,
				average_quiz_score: 82.5,
				study_minutes_count: 240,
			})
		);

		expect(result?.enrolled_courses_count).toBe(4);
		expect(result?.average_quiz_score).toBe(82.5);
		expect(result?.study_minutes_count).toBe(240);
	});

	it("normalises the jsonb collections into arrays", () => {
		const result = normalizeStudentOverview(
			makeRow({
				course_enrollments: [
					{ id: "e1", course_id: "c1", course_title: "Algebra" },
				],
				quiz_attempts: [{ id: "q1", quiz_id: "z1", score: 9 }],
			})
		);

		expect(Array.isArray(result?.course_enrollments)).toBe(true);
		expect(result?.course_enrollments).toHaveLength(1);
		expect(result?.course_enrollments[0].course_title).toBe("Algebra");
		expect(result?.quiz_attempts[0].score).toBe(9);
	});

	it("falls back to empty arrays when a collection is not an array", () => {
		const result = normalizeStudentOverview(
			makeRow({
				course_enrollments: "not-an-array" as never,
				quiz_attempts: null as never,
				deck_progress: { unexpected: true } as never,
				classrooms: 42 as never,
				certificates: "nope" as never,
			})
		);

		expect(result?.course_enrollments).toEqual([]);
		expect(result?.quiz_attempts).toEqual([]);
		expect(result?.deck_progress).toEqual([]);
		expect(result?.classrooms).toEqual([]);
		expect(result?.certificates).toEqual([]);
	});

	it("normalises activity entries into a stable shape", () => {
		const result = normalizeStudentOverview(
			makeRow({
				activity: [
					{
						type: "enrollment",
						label: "Enrolled in Algebra",
						ts: "2026-01-05T10:00:00Z",
						meta: { course_title: "Algebra" },
					},
				],
			})
		);

		expect(result?.activity).toHaveLength(1);
		expect(result?.activity[0]).toEqual({
			type: "enrollment",
			label: "Enrolled in Algebra",
			ts: "2026-01-05T10:00:00Z",
			meta: { course_title: "Algebra" },
		});
	});

	it("tolerates activity entries with missing or malformed fields", () => {
		const result = normalizeStudentOverview(
			makeRow({
				activity: [
					{ label: "Something happened" },
					{ type: "quiz_attempt", ts: 12345 },
				] as never,
			})
		);

		expect(result?.activity).toHaveLength(2);
		expect(result?.activity[0].type).toBe("unknown");
		expect(result?.activity[0].label).toBe("Something happened");
		expect(result?.activity[0].ts).toBeNull();
		expect(result?.activity[0].meta).toEqual({});
		// A non-string timestamp is dropped rather than rendered as "NaN".
		expect(result?.activity[1].ts).toBeNull();
	});

	it("drops activity entries that are not objects", () => {
		const result = normalizeStudentOverview(
			makeRow({ activity: ["oops", 42] as never })
		);

		// Non-object entries are skipped by the array coercion.
		expect(
			result?.activity.every((entry) => typeof entry.type === "string")
		).toBe(true);
	});
});
