"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { CourseMeta } from "./course-card";

// ============================================================
// COURSE CARD STATS
// ============================================================
//
// A course card shows three numbers that do not live on the `courses` row:
// how many lessons the course has, how long its lessons add up to, and how
// many students enrolled. None of them are readable directly by a card:
// `lessons` needs can_view_course() (signed-out visitors get nothing) and
// `enrollments` is only readable by the student themselves and admins.
//
// `get_course_card_stats` is a SECURITY DEFINER RPC that returns just those
// aggregates for a set of course ids (same pattern as get_deck_card_counts).
// Before the migration is applied the RPC simply doesn't exist, so we fall
// back to counting lessons client-side wherever RLS allows it — cards then
// show lessons/duration but not students, instead of breaking.

export type CourseCardStats = {
	lessons: number | null;
	minutes: number | null;
	enrollments: number | null;
};

type Client = SupabaseClient<Database>;

function emptyStats(): CourseCardStats {
	return { lessons: null, minutes: null, enrollments: null };
}

/** Lessons visible to the caller, aggregated per course (RLS-limited). */
async function lessonsFallback(
	client: Client,
	courseIds: string[]
): Promise<Record<string, CourseCardStats>> {
	const { data, error } = await client
		.from("lessons")
		.select("course_id, estimated_duration_minutes")
		.in("course_id", courseIds);

	const stats: Record<string, CourseCardStats> = {};
	if (error || !data) return stats;

	for (const row of data) {
		if (!row.course_id) continue;
		const entry = stats[row.course_id] ?? emptyStats();
		entry.lessons = (entry.lessons ?? 0) + 1;
		entry.minutes =
			(entry.minutes ?? 0) + (row.estimated_duration_minutes ?? 0);
		stats[row.course_id] = entry;
	}
	return stats;
}

/**
 * Aggregated lesson/enrollment numbers for a page of course cards, keyed by
 * course id. Never throws: a failed lookup just leaves the cards without
 * numbers.
 */
export async function fetchCourseCardStats(
	client: Client,
	courseIds: readonly string[]
): Promise<Record<string, CourseCardStats>> {
	const ids = [...new Set(courseIds)].filter(Boolean);
	if (ids.length === 0) return {};

	const { data, error } = await client.rpc("get_course_card_stats", {
		p_course_ids: ids,
	});

	if (!error && data) {
		const stats: Record<string, CourseCardStats> = {};
		for (const row of data) {
			stats[row.course_id] = {
				lessons: Number(row.lessons_count),
				minutes: Number(row.lessons_minutes),
				enrollments: Number(row.enrollments_count),
			};
		}
		return stats;
	}

	return lessonsFallback(client, ids);
}

/** Merges stats into course cards, keeping whatever the query already had. */
export function withCourseCardStats(
	courses: readonly CourseMeta[],
	stats: Record<string, CourseCardStats> | undefined
): CourseMeta[] {
	if (!stats) return [...courses];

	return courses.map((course) => {
		const extra = stats[course.id];
		if (!extra) return course;

		const lessons = extra.lessons ?? course.total_lessons;
		const minutes = extra.minutes ?? course.total_duration_minutes;
		const enrollments = extra.enrollments ?? course.total_enrollments;

		return {
			...course,
			total_lessons: lessons || undefined,
			// A course whose lessons carry no duration keeps falling back to the
			// hours typed into the course details, so 0 here means "unknown".
			total_duration_minutes: minutes || undefined,
			total_enrollments: enrollments || undefined,
		};
	});
}

/**
 * Enriches the course cards of one page with lesson/enrollment stats.
 * Returns the courses unchanged while loading or when the lookup fails.
 */
export function useCourseCardStats(
	courses: readonly CourseMeta[]
): CourseMeta[] {
	const ids = React.useMemo(
		() => [...new Set(courses.map((course) => course.id))].sort(),
		[courses]
	);
	const key = ids.join(",");

	const { data } = useQuery({
		queryKey: ["course-card-stats", key],
		queryFn: () => fetchCourseCardStats(createClient(), ids),
		enabled: ids.length > 0,
		staleTime: 60_000,
		retry: 1,
	});

	return React.useMemo(
		() => withCourseCardStats(courses, data),
		// `key` covers the id set; `courses` covers the card data itself.
		[courses, key, data]
	);
}

// ============================================================
// DURATION FORMATTING
// ============================================================

/** Splits total minutes into whole hours + remaining minutes. */
export function splitDuration(totalMinutes: number): {
	hours: number;
	minutes: number;
} {
	const safe = Math.max(0, Math.round(totalMinutes));
	return { hours: Math.floor(safe / 60), minutes: safe % 60 };
}
