"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseServerConfigured } from "@/lib/env/server-env";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Result<T = null> =
	| { success: true; data: T }
	| { success: false; error: string };

export type RoadmapRow = Tables<"roadmaps">;
export type RoadmapItemRow = Tables<"roadmap_items">;

export type RoadmapWithItems = RoadmapRow & {
	roadmap_items: Array<
		RoadmapItemRow & { course: { title: string; slug: string } | null }
	>;
};

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

function touchPublicPages() {
	revalidatePath("/", "layout");
}

function makeSlug(title: string): string {
	// ASCII-only slugs keep URLs and route params simple; non-latin titles
	// fall back to a timestamped slug.
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return base.length > 2 ? base : `roadmap-${Date.now().toString(36)}`;
}

const ITEM_SELECT = "*, course:courses(title, slug)";

// ─── Read ───────────────────────────────────────────────────────────────────

/** Roadmaps the caller manages (their own, or all for platform admins). */
export async function listManagedRoadmaps(): Promise<
	Result<RoadmapWithItems[]>
> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("roadmaps")
		.select(`*, roadmap_items(${ITEM_SELECT})`)
		.order("updated_at", { ascending: false });

	if (error) return { success: false, error: error.message };
	const rows = (data ?? []) as unknown as RoadmapWithItems[];
	for (const roadmap of rows) {
		roadmap.roadmap_items.sort((a, b) => a.order_index - b.order_index);
	}
	return { success: true, data: rows };
}

/** Published roadmaps with ordered course items — for the public pages/hub. */
export async function listPublishedRoadmaps(): Promise<
	Result<RoadmapWithItems[]>
> {
	if (!isSupabaseServerConfigured) {
		return { success: true, data: [] };
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("roadmaps")
		.select(`*, roadmap_items(${ITEM_SELECT})`)
		.eq("is_published", true)
		.order("updated_at", { ascending: false });

	if (error) return { success: false, error: error.message };
	const rows = (data ?? []) as unknown as RoadmapWithItems[];
	for (const roadmap of rows) {
		roadmap.roadmap_items.sort((a, b) => a.order_index - b.order_index);
	}
	return { success: true, data: rows };
}

/** One published roadmap by slug (public detail page). */
export async function getPublishedRoadmapBySlug(
	slug: string
): Promise<Result<RoadmapWithItems | null>> {
	if (!isSupabaseServerConfigured) {
		return { success: true, data: null };
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("roadmaps")
		.select(`*, roadmap_items(${ITEM_SELECT})`)
		.eq("slug", slug)
		.eq("is_published", true)
		.maybeSingle();

	if (error) return { success: false, error: error.message };
	const row = data as unknown as RoadmapWithItems | null;
	if (row) {
		row.roadmap_items.sort((a, b) => a.order_index - b.order_index);
	}
	return { success: true, data: row };
}

/** Courses the caller may add to a roadmap (RLS-visible courses). */
export async function searchCoursesForRoadmap(
	search: string
): Promise<
	Result<Array<Pick<Tables<"courses">, "id" | "title" | "slug" | "level">>>
> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	let query = supabase
		.from("courses")
		.select("id, title, slug, level")
		.order("created_at", { ascending: false })
		.limit(20);
	const trimmed = search.trim();
	if (trimmed.length > 0) {
		query = query.ilike("title", "%" + trimmed + "%");
	}

	const { data, error } = await query;
	if (error) return { success: false, error: error.message };
	return { success: true, data: data ?? [] };
}

// ─── Roadmap CRUD ───────────────────────────────────────────────────────────

export async function createRoadmap(input: {
	title: string;
	description?: string;
}): Promise<Result<RoadmapRow>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("roadmaps")
		.insert({
			title: input.title,
			description: input.description ?? null,
			slug: makeSlug(input.title),
			created_by: user.id,
		})
		.select()
		.single();

	if (error) return { success: false, error: error.message };
	touchPublicPages();
	return { success: true, data };
}

export async function updateRoadmap(
	id: string,
	patch: Partial<
		Pick<
			RoadmapRow,
			"title" | "description" | "cover_image_url" | "accent" | "is_published"
		>
	>
): Promise<Result<RoadmapRow>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("roadmaps")
		.update(patch)
		.eq("id", id)
		.select()
		.single();

	if (error) return { success: false, error: error.message };
	touchPublicPages();
	return { success: true, data };
}

export async function deleteRoadmap(id: string): Promise<Result<null>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase.from("roadmaps").delete().eq("id", id);
	if (error) return { success: false, error: error.message };
	touchPublicPages();
	return { success: true, data: null };
}

// ─── Items (ordered courses of a roadmap) ────────────────────────────────────

/**
 * Replace the roadmap's course list with the given ordered course ids.
 * Replace-all keeps ordering trivial to reason about and is atomic from the
 * editor's perspective (the editor always holds the full list).
 */
export async function setRoadmapItems(
	roadmapId: string,
	courseIds: string[]
): Promise<Result<RoadmapItemRow[]>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const unique = [...new Set(courseIds)];
	const { error: deleteError } = await supabase
		.from("roadmap_items")
		.delete()
		.eq("roadmap_id", roadmapId);
	if (deleteError) return { success: false, error: deleteError.message };

	if (unique.length === 0) {
		touchPublicPages();
		return { success: true, data: [] };
	}

	const { data, error } = await supabase
		.from("roadmap_items")
		.insert(
			unique.map((courseId, index) => ({
				roadmap_id: roadmapId,
				course_id: courseId,
				order_index: index,
			}))
		)
		.select();

	if (error) return { success: false, error: error.message };
	touchPublicPages();
	return { success: true, data: data ?? [] };
}
