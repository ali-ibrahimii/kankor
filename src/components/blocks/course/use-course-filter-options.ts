"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReferenceOption = { id: string; name: string };

export type BookOption = ReferenceOption & {
	grade_id: string | null;
	subject_id: string | null;
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchSubjects(): Promise<ReferenceOption[]> {
	const client = createClient();
	const { data, error } = await client
		.from("subjects")
		.select("id, name")
		.order("name");
	if (error) throw error;
	return data ?? [];
}

async function fetchGrades(): Promise<ReferenceOption[]> {
	const client = createClient();
	const { data, error } = await client
		.from("grades")
		.select("id, name")
		.order("ordering");
	if (error) throw error;
	return data ?? [];
}

async function fetchBooks(): Promise<BookOption[]> {
	const client = createClient();
	const { data, error } = await client
		.from("books")
		.select("id, name:full_name, grade_id, subject_id")
		.order("full_name");
	if (error) throw error;
	return (data ?? []) as BookOption[];
}

async function fetchInstructors(): Promise<ReferenceOption[]> {
	const client = createClient();
	const { data, error } = await client
		.from("profiles")
		.select("id, name:full_name")
		.eq("role", "instructor")
		.order("full_name");
	if (error) throw error;
	return (data ?? []).map((p) => ({ id: p.id, name: p.name ?? "" }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const STALE_TIME = 5 * 60 * 1000; // reference data changes rarely

export type UseCourseFilterOptionsInput = {
	subjects?: boolean;
	grades?: boolean;
	books?: boolean;
	instructors?: boolean;
};

/** Reference-data options for course filter dropdowns (subject/grade/book/instructor). */
export function useCourseFilterOptions({
	subjects,
	grades,
	books,
	instructors,
}: UseCourseFilterOptionsInput) {
	const subjectsQuery = useQuery({
		queryKey: ["subjects", "filter-options"],
		queryFn: fetchSubjects,
		enabled: !!subjects,
		staleTime: STALE_TIME,
	});

	const gradesQuery = useQuery({
		queryKey: ["grades", "filter-options"],
		queryFn: fetchGrades,
		enabled: !!grades,
		staleTime: STALE_TIME,
	});

	const booksQuery = useQuery({
		queryKey: ["books", "filter-options"],
		queryFn: fetchBooks,
		enabled: !!books,
		staleTime: STALE_TIME,
	});

	const instructorsQuery = useQuery({
		queryKey: ["instructors", "filter-options"],
		queryFn: fetchInstructors,
		enabled: !!instructors,
		staleTime: STALE_TIME,
	});

	return {
		subjects: subjectsQuery.data ?? [],
		grades: gradesQuery.data ?? [],
		books: booksQuery.data ?? [],
		instructors: instructorsQuery.data ?? [],
	};
}
