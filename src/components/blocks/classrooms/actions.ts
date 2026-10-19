"use server";

import { revalidatePath } from "next/cache";
import type { ClassroomMembershipRequest } from "@/components/blocks/classroom-builder/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type {
	ClassroomDetailForMember,
	MyClassroom,
	MyClassroomRequest,
} from "./types";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

export async function requestJoinClassroom(
	joinCode: string
): Promise<Result<ClassroomMembershipRequest>> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("request_join_classroom", {
		p_join_code: joinCode.trim(),
	});
	if (error) return { success: false, error: error.message };

	revalidatePath("/d/classrooms");

	return { success: true, data };
}

export async function listMyClassrooms(): Promise<Result<MyClassroom[]>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classroom_members")
		.select(
			"id, classroom_id, role, created_at, classroom:classrooms(name, description, cover_image)"
		)
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	return {
		success: true,
		data: (data ?? []).map((row) => {
			const classroom = Array.isArray(row.classroom)
				? row.classroom[0]
				: row.classroom;
			return {
				membership_id: row.id,
				classroom_id: row.classroom_id,
				role: row.role,
				joined_at: row.created_at,
				name: classroom?.name ?? "Untitled classroom",
				description: classroom?.description ?? null,
				cover_image: classroom?.cover_image ?? null,
			};
		}),
	};
}

export async function listMyPendingClassroomRequests(): Promise<
	Result<MyClassroomRequest[]>
> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("classroom_membership_requests")
		.select("id, classroom_id, initiated_by, created_at, classroom_name")
		.eq("user_id", user.id)
		.eq("status", "pending")
		.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	return {
		success: true,
		data: (data ?? []).map((row) => ({
			id: row.id,
			classroom_id: row.classroom_id,
			classroom_name: row.classroom_name ?? "Untitled classroom",
			initiated_by: row.initiated_by,
			created_at: row.created_at,
		})),
	};
}

export async function respondToMyClassroomRequest(
	requestId: string,
	approve: boolean
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase.rpc("respond_to_classroom_request", {
		p_request_id: requestId,
		p_approve: approve,
	});
	if (error) return { success: false, error: error.message };

	revalidatePath("/d/classrooms");

	return { success: true, data: undefined };
}

export async function getMyClassroomDetail(
	classroomId: string
): Promise<Result<ClassroomDetailForMember>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data: membership } = await supabase
		.from("classroom_members")
		.select("role")
		.eq("classroom_id", classroomId)
		.eq("user_id", user.id)
		.maybeSingle();
	if (!membership) {
		return { success: false, error: "You are not a member of this classroom." };
	}

	const [classroomRes, resourcesRes, materialsRes, announcementsRes] =
		await Promise.all([
			supabase
				.from("classrooms")
				.select("id, name, description, cover_image")
				.eq("id", classroomId)
				.single(),
			supabase
				.from("classroom_resources")
				.select("id, resource_type, resource_id")
				.eq("classroom_id", classroomId)
				.order("created_at"),
			supabase
				.from("classroom_materials")
				.select("id, title, description, type, created_at")
				.eq("classroom_id", classroomId)
				.eq("published", true)
				.order("created_at", { ascending: false }),
			supabase
				.from("classroom_announcements")
				.select(
					"id, message, created_at, author:profiles(full_name, avatar_url)"
				)
				.eq("classroom_id", classroomId)
				.order("created_at", { ascending: false }),
		]);

	if (classroomRes.error || !classroomRes.data) {
		return {
			success: false,
			error: classroomRes.error?.message ?? "Classroom not found.",
		};
	}

	const rawResources = resourcesRes.data ?? [];
	const deckIds = rawResources
		.filter((r) => r.resource_type === "deck")
		.map((r) => r.resource_id);
	const courseIds = rawResources
		.filter((r) => r.resource_type === "course")
		.map((r) => r.resource_id);

	const [deckDetailsRes, courseDetailsRes] = await Promise.all([
		deckIds.length > 0
			? supabase.from("decks").select("id, name, slug").in("id", deckIds)
			: Promise.resolve({
					data: [] as { id: string; name: string; slug: string | null }[],
				}),
		courseIds.length > 0
			? supabase.from("courses").select("id, title, slug").in("id", courseIds)
			: Promise.resolve({
					data: [] as { id: string; title: string; slug: string | null }[],
				}),
	]);

	const deckMap = new Map((deckDetailsRes.data ?? []).map((d) => [d.id, d]));
	const courseMap = new Map(
		(courseDetailsRes.data ?? []).map((c) => [c.id, c])
	);

	const resources = rawResources.map((r) => {
		if (r.resource_type === "deck") {
			const deck = deckMap.get(r.resource_id);
			return {
				id: r.id,
				resource_type: r.resource_type,
				resource_id: r.resource_id,
				title: deck?.name ?? r.resource_id,
				href: deck?.slug ? routes.decks.slug.page({ slug: deck.slug }) : null,
			};
		}
		if (r.resource_type === "course") {
			const course = courseMap.get(r.resource_id);
			return {
				id: r.id,
				resource_type: r.resource_type,
				resource_id: r.resource_id,
				title: course?.title ?? r.resource_id,
				href: course?.slug
					? routes.courses.slug.page({ slug: course.slug })
					: null,
			};
		}
		return {
			id: r.id,
			resource_type: r.resource_type,
			resource_id: r.resource_id,
			title: r.resource_id,
			href: null,
		};
	});

	const materials = (materialsRes.data ?? []).map((m) => ({
		id: m.id,
		title: m.title,
		description: m.description,
		type: m.type,
		created_at: m.created_at,
	}));

	const announcements = (announcementsRes.data ?? []).map((a) => {
		const author = Array.isArray(a.author) ? a.author[0] : a.author;
		return {
			id: a.id,
			message: a.message,
			created_at: a.created_at,
			author: author ?? null,
		};
	});

	return {
		success: true,
		data: {
			...classroomRes.data,
			role: membership.role,
			resources,
			materials,
			announcements,
		},
	};
}
