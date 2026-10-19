"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
	AddMaterialFormValues,
	AddResourceFormValues,
	ClassroomAnnouncement,
	ClassroomDetails,
	ClassroomFolder,
	ClassroomMaterial,
	ClassroomMember,
	ClassroomResource,
	EditClassroomFormValues,
	NewAnnouncementFormValues,
	NewClassroomFormValues,
	ShareableType,
} from "./types";

// ─── Result type ──────────────────────────────────────────────────────────────

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

import { generateNumeric } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateJoinCode(): string {
	return generateNumeric();
}

// ─── Create classroom ─────────────────────────────────────────────────────────

export async function createClassroom(
	values: NewClassroomFormValues
): Promise<Result<{ classroomId: string }>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classrooms")
		.insert({
			name: values.name.trim(),
			description: values.description.trim() || null,
			join_code: (values.join_code || generateJoinCode()).trim(),
			user_id: user.id,
		})
		.select("id")
		.single();

	if (error) return { success: false, error: error.message };

	// Auto-add creator as owner
	await supabase.from("classroom_members").insert({
		classroom_id: data.id,
		user_id: user.id,
		role: "owner",
	});

	revalidatePath("/d/instructor/classrooms");
	revalidatePath("/d/admin/classrooms");
	revalidatePath("/d/school/classrooms");

	return { success: true, data: { classroomId: data.id } };
}

// ─── Load classroom with all relations ───────────────────────────────────────

export async function loadClassroomBuilder(classroomId: string): Promise<
	Result<{
		classroom: ClassroomDetails;
		members: ClassroomMember[];
		resources: ClassroomResource[];
		materials: ClassroomMaterial[];
		folders: ClassroomFolder[];
		announcements: ClassroomAnnouncement[];
	}>
> {
	const supabase = await createClient();

	const [
		classroomRes,
		membersRes,
		resourcesRes,
		materialsRes,
		foldersRes,
		announcementsRes,
	] = await Promise.all([
		supabase.from("classrooms").select("*").eq("id", classroomId).single(),
		supabase
			.from("classroom_members")
			.select("*, profile:profiles(id, full_name, avatar_url)")
			.eq("classroom_id", classroomId)
			.order("created_at"),
		supabase
			.from("classroom_resources")
			.select("*")
			.eq("classroom_id", classroomId)
			.order("created_at"),
		supabase
			.from("classroom_materials")
			.select("*")
			.eq("classroom_id", classroomId)
			.order("created_at"),
		supabase
			.from("classroom_folders")
			.select("*")
			.eq("classroom_id", classroomId)
			.order("sort_order"),
		supabase
			.from("classroom_announcements")
			.select("*, author:profiles(full_name, avatar_url)")
			.eq("classroom_id", classroomId)
			.order("created_at", { ascending: false }),
	]);

	if (classroomRes.error || !classroomRes.data)
		return {
			success: false,
			error: classroomRes.error?.message ?? "Classroom not found",
		};

	const classroom: ClassroomDetails = classroomRes.data;

	const members: ClassroomMember[] = (membersRes.data ?? []).map((m) => ({
		id: m.id,
		classroom_id: m.classroom_id,
		user_id: m.user_id,
		role: m.role,
		created_at: m.created_at,
		profile: Array.isArray(m.profile) ? m.profile[0] : (m.profile ?? undefined),
	}));

	const rawResources: ClassroomResource[] = resourcesRes.data ?? [];

	// Resolve display titles for resources (polymorphic join)
	const deckIds = rawResources
		.filter((r) => r.resource_type === "deck")
		.map((r) => r.resource_id);
	const courseIds = rawResources
		.filter((r) => r.resource_type === "course")
		.map((r) => r.resource_id);

	const [deckTitlesRes, courseTitlesRes] = await Promise.all([
		deckIds.length > 0
			? supabase.from("decks").select("id, name").in("id", deckIds)
			: Promise.resolve({ data: [] as { id: string; name: string }[] }),
		courseIds.length > 0
			? supabase.from("courses").select("id, title").in("id", courseIds)
			: Promise.resolve({ data: [] as { id: string; title: string }[] }),
	]);

	const deckNameMap = Object.fromEntries(
		(deckTitlesRes.data ?? []).map((d) => [d.id, d.name])
	);
	const courseTitleMap = Object.fromEntries(
		(courseTitlesRes.data ?? []).map((c) => [c.id, c.title])
	);

	const resources: ClassroomResource[] = rawResources.map((r) => ({
		...r,
		title:
			r.resource_type === "deck"
				? (deckNameMap[r.resource_id] ?? r.resource_id)
				: r.resource_type === "course"
					? (courseTitleMap[r.resource_id] ?? r.resource_id)
					: undefined,
	}));

	const materials: ClassroomMaterial[] = materialsRes.data ?? [];
	const folders: ClassroomFolder[] = foldersRes.data ?? [];

	const announcements: ClassroomAnnouncement[] = (
		announcementsRes.data ?? []
	).map((a) => ({
		id: a.id,
		classroom_id: a.classroom_id,
		author_id: a.author_id,
		message: a.message,
		created_at: a.created_at,
		updated_at: a.updated_at,
		author: Array.isArray(a.author) ? a.author[0] : (a.author ?? undefined),
	}));

	return {
		success: true,
		data: {
			classroom,
			members,
			resources,
			materials,
			folders,
			announcements,
		},
	};
}

// ─── Update classroom ─────────────────────────────────────────────────────────

export async function updateClassroom(
	classroomId: string,
	values: EditClassroomFormValues
): Promise<Result<ClassroomDetails>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classrooms")
		.update({
			name: values.name.trim(),
			description: values.description.trim() || null,
		})
		.eq("id", classroomId)
		.select("*")
		.single();

	if (error) return { success: false, error: error.message };

	revalidatePath(`/d/instructor/classrooms/${classroomId}/edit`);

	return { success: true, data };
}

// ─── Add resource ─────────────────────────────────────────────────────────────

export async function addClassroomResource(
	classroomId: string,
	values: AddResourceFormValues
): Promise<Result<ClassroomResource>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classroom_resources")
		.insert({
			classroom_id: classroomId,
			resource_id: values.resource_id,
			resource_type: values.resource_type as ShareableType,
			shared_by: user.id,
		})
		.select("*")
		.single();

	if (error) return { success: false, error: error.message };

	return { success: true, data };
}

// ─── Remove resource ──────────────────────────────────────────────────────────

export async function removeClassroomResource(
	resourceId: string
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("classroom_resources")
		.delete()
		.eq("id", resourceId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

// ─── Add material ─────────────────────────────────────────────────────────────

export async function addClassroomMaterial(
	classroomId: string,
	values: AddMaterialFormValues
): Promise<Result<ClassroomMaterial>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classroom_materials")
		.insert({
			classroom_id: classroomId,
			title: values.title.trim(),
			description: values.description.trim() || null,
			type: (values.type || "other") as import("./types").ClassroomMaterialType,
			folder_id: values.folder_id || null,
			created_by: user.id,
		})
		.select("*")
		.single();

	if (error) return { success: false, error: error.message };

	return { success: true, data };
}

// ─── Remove material ──────────────────────────────────────────────────────────

export async function removeClassroomMaterial(
	materialId: string
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("classroom_materials")
		.delete()
		.eq("id", materialId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

// ─── Toggle material published ────────────────────────────────────────────────

export async function toggleMaterialPublished(
	materialId: string,
	published: boolean
): Promise<Result<{ published: boolean; published_at: string | null }>> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("classroom_materials")
		.update({
			published,
			published_at: published ? new Date().toISOString() : null,
		})
		.eq("id", materialId)
		.select("published, published_at")
		.single();

	if (error) return { success: false, error: error.message };

	return { success: true, data };
}

// ─── Post announcement ────────────────────────────────────────────────────────

export async function postAnnouncement(
	classroomId: string,
	values: NewAnnouncementFormValues
): Promise<Result<ClassroomAnnouncement>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classroom_announcements")
		.insert({
			classroom_id: classroomId,
			author_id: user.id,
			message: values.message.trim(),
		})
		.select("*, author:profiles(full_name, avatar_url)")
		.single();

	if (error) return { success: false, error: error.message };

	return {
		success: true,
		data: {
			id: data.id,
			classroom_id: data.classroom_id,
			author_id: data.author_id,
			message: data.message,
			created_at: data.created_at,
			updated_at: data.updated_at,
			author: Array.isArray(data.author)
				? data.author[0]
				: (data.author ?? undefined),
		},
	};
}

// ─── Delete announcement ──────────────────────────────────────────────────────

export async function deleteAnnouncement(
	announcementId: string
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("classroom_announcements")
		.delete()
		.eq("id", announcementId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

// ─── Remove member ────────────────────────────────────────────────────────────

export async function removeClassroomMember(memberId: string): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("classroom_members")
		.delete()
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

// ─── Update member role ───────────────────────────────────────────────────────

export async function updateMemberRole(
	memberId: string,
	role: import("./types").ClassroomRole
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("classroom_members")
		.update({ role })
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: undefined };
}

// ─── Regenerate join code ─────────────────────────────────────────────────────

export async function regenerateJoinCode(
	classroomId: string
): Promise<Result<{ join_code: string }>> {
	const supabase = await createClient();

	const newCode = generateJoinCode();

	const { error } = await supabase
		.from("classrooms")
		.update({ join_code: newCode })
		.eq("id", classroomId);

	if (error) return { success: false, error: error.message };

	return { success: true, data: { join_code: newCode } };
}

// ─── Fetch instructor's shareable resources ───────────────────────────────────

export async function fetchMyDecks(): Promise<
	Result<{ id: string; name: string }[]>
> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("decks")
		.select("id, name")
		.eq("user_id", user.id)
		.order("name");

	if (error) return { success: false, error: error.message };

	return { success: true, data: data ?? [] };
}

export async function fetchMyCourses(): Promise<
	Result<{ id: string; title: string }[]>
> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("courses")
		.select("id, title")
		.eq("instructor_id", user.id)
		.order("title");

	if (error) return { success: false, error: error.message };

	return { success: true, data: data ?? [] };
}
