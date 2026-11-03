"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { CourseMeta } from "./course-card";

// ─────────────────────────────────────────────────────────────────────────────
// Platform authorship on cards
//
// A course authored by an admin belongs to the platform, not to that person:
// the admin panel and the public site should read "ابزار کانکور", never the
// admin's own name. New admin-authored courses already point
// `instructor_id` at the platform profile (see lib/platform-author.ts); this
// helper covers courses created before that, and any course whose author is an
// admin, without a schema change.
//
// The profiles RLS policy only lets a caller read its own row plus rows whose
// role is `admin`, so a lookup here returns exactly the ids we need.
// ─────────────────────────────────────────────────────────────────────────────

/** Roles whose courses are published as the platform instead of a person. */
const PLATFORM_AUTHOR_ROLES = new Set(["admin"]);

type AuthorLookupRow = { id: string; role: string | null };

type Client = SupabaseClient<Database>;

export async function fetchPlatformAuthorIds(
	client: Client,
	authorIds: readonly string[]
): Promise<Set<string>> {
	const ids = [...new Set(authorIds)].filter(Boolean);
	if (ids.length === 0) return new Set();

	const { data, error } = await client
		.from("profiles")
		.select("id, role")
		.in("id", ids);

	if (error || !data) return new Set();

	return new Set(
		(data as AuthorLookupRow[])
			.filter((row) => row.role !== null && PLATFORM_AUTHOR_ROLES.has(row.role))
			.map((row) => row.id)
	);
}

/** Flags the byline of every course authored by an admin as the platform. */
export function markPlatformAuthors(
	courses: readonly CourseMeta[],
	platformAuthorIds: ReadonlySet<string>
): CourseMeta[] {
	if (platformAuthorIds.size === 0) return [...courses];

	return courses.map((course) => {
		if (!course.instructor) return course;
		if (!course.instructor_id || !platformAuthorIds.has(course.instructor_id))
			return course;

		return {
			...course,
			instructor: { ...course.instructor, is_platform: true },
		};
	});
}

/** Enriches cards with the platform flag; never throws, never blocks a list. */
export function usePlatformAuthors(
	courses: readonly CourseMeta[]
): CourseMeta[] {
	const authorIds = React.useMemo(
		() =>
			[
				...new Set(
					courses
						.map((course) => course.instructor_id)
						.filter((id): id is string => Boolean(id))
				),
			].sort(),
		[courses]
	);
	const key = authorIds.join(",");

	const { data } = useQuery({
		queryKey: ["platform-authors", key],
		queryFn: () => fetchPlatformAuthorIds(createClient(), authorIds),
		enabled: authorIds.length > 0,
		staleTime: 5 * 60_000,
		retry: 1,
	});

	return React.useMemo(
		() => markPlatformAuthors(courses, data ?? new Set<string>()),
		[courses, data]
	);
}
