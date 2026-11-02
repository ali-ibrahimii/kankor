import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { CourseMeta } from "@/components/blocks/course/course-card";
import {
	fetchCourseCardStats,
	splitDuration,
	withCourseCardStats,
} from "@/components/blocks/course/course-stats";
import type { Database } from "@/lib/supabase/database.types";

// ─── Fakes ────────────────────────────────────────────────────────────────────

function fakeClient(options: { rpc?: () => unknown; lessons?: () => unknown }) {
	const rpc = vi.fn(options.rpc ?? (() => ({ data: null, error: null })));
	const lessonsSelect = vi.fn(() => ({
		in: vi.fn(options.lessons ?? (async () => ({ data: [], error: null }))),
	}));
	const from = vi.fn(() => ({ select: lessonsSelect }));
	return { client: { rpc, from } as unknown as SupabaseClient<Database>, rpc };
}

const course = (id: string, extra: Partial<CourseMeta> = {}) =>
	({
		id,
		title: id,
		...extra,
	}) as unknown as CourseMeta;

// ─── fetchCourseCardStats ─────────────────────────────────────────────────────

describe("fetchCourseCardStats", () => {
	it("maps the RPC result by course id", async () => {
		const { client, rpc } = fakeClient({
			rpc: () => ({
				error: null,
				data: [
					{
						course_id: "a",
						lessons_count: 12,
						lessons_minutes: 185,
						enrollments_count: 24,
					},
				],
			}),
		});

		const stats = await fetchCourseCardStats(client, ["a", "a"]);

		expect(rpc).toHaveBeenCalledWith("get_course_card_stats", {
			p_course_ids: ["a"],
		});
		expect(stats.a).toEqual({ lessons: 12, minutes: 185, enrollments: 24 });
	});

	it("counts lessons itself when the aggregate RPC is not deployed yet", async () => {
		const { client } = fakeClient({
			// Migration not applied → PostgREST reports an unknown function.
			rpc: () => ({ data: null, error: { code: "PGRST202" } }),
			lessons: async () => ({
				error: null,
				data: [
					{ course_id: "a", estimated_duration_minutes: 30 },
					{ course_id: "a", estimated_duration_minutes: 45 },
					{ course_id: "b", estimated_duration_minutes: null },
				],
			}),
		});

		const stats = await fetchCourseCardStats(client, ["a", "b"]);

		expect(stats.a).toEqual({ lessons: 2, minutes: 75, enrollments: null });
		expect(stats.b).toEqual({ lessons: 1, minutes: 0, enrollments: null });
	});

	it("does nothing for an empty page of courses", async () => {
		const { client, rpc } = fakeClient({});
		expect(await fetchCourseCardStats(client, [])).toEqual({});
		expect(rpc).not.toHaveBeenCalled();
	});
});

// ─── withCourseCardStats ──────────────────────────────────────────────────────

describe("withCourseCardStats", () => {
	it("merges lessons, lesson time and students onto the card", () => {
		const [enriched] = withCourseCardStats(
			[course("a", { average_rating: 0 })],
			{
				a: { lessons: 12, minutes: 185, enrollments: 24 },
			}
		);

		expect(enriched.total_lessons).toBe(12);
		expect(enriched.total_duration_minutes).toBe(185);
		expect(enriched.total_enrollments).toBe(24);
	});

	it("keeps the values the query already had when stats are missing", () => {
		const [enriched] = withCourseCardStats(
			[
				course("a", {
					total_lessons: 5,
					total_duration_minutes: 60,
					total_enrollments: 3,
				}),
			],
			{}
		);

		expect(enriched.total_lessons).toBe(5);
		expect(enriched.total_duration_minutes).toBe(60);
		expect(enriched.total_enrollments).toBe(3);
	});

	it("treats zero students / zero minutes as 'unknown' instead of printing 0", () => {
		// A brand-new course must not read "۰ شاگرد" or "۰ دقیقه" on its card.
		const [enriched] = withCourseCardStats([course("a")], {
			a: { lessons: 2, minutes: 0, enrollments: 0 },
		});

		expect(enriched.total_lessons).toBe(2);
		expect(enriched.total_duration_minutes).toBeUndefined();
		expect(enriched.total_enrollments).toBeUndefined();
	});

	it("is a no-op while the stats are still loading", () => {
		const courses = [course("a")];
		expect(withCourseCardStats(courses, undefined)).toEqual(courses);
	});
});

// ─── splitDuration ───────────────────────────────────────────────────────────

describe("splitDuration", () => {
	it("splits lesson minutes into hours and minutes", () => {
		expect(splitDuration(185)).toEqual({ hours: 3, minutes: 5 });
		expect(splitDuration(60)).toEqual({ hours: 1, minutes: 0 });
		expect(splitDuration(45)).toEqual({ hours: 0, minutes: 45 });
		expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0 });
	});

	it("never returns negative or fractional minutes", () => {
		expect(splitDuration(-10)).toEqual({ hours: 0, minutes: 0 });
		expect(splitDuration(29.6)).toEqual({ hours: 0, minutes: 30 });
	});
});
