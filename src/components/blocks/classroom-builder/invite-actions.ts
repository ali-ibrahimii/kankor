"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ClassroomMembershipRequest } from "./types";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

export async function inviteStudentToClassroom(
	classroomId: string,
	email: string
): Promise<Result<ClassroomMembershipRequest>> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("create_classroom_invite", {
		p_classroom_id: classroomId,
		p_student_email: email.trim(),
	});
	if (error) return { success: false, error: error.message };

	revalidatePath(`/d/instructor/classrooms/${classroomId}/edit`);

	return { success: true, data };
}

export async function listClassroomRequests(
	classroomId: string
): Promise<Result<ClassroomMembershipRequest[]>> {
	const supabase = await createClient();

	const { data: requests, error } = await supabase
		.from("classroom_membership_requests")
		.select("*")
		.eq("classroom_id", classroomId)
		.eq("status", "pending")
		.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	const userIds = [...new Set((requests ?? []).map((r) => r.user_id))];
	const { data: profiles } =
		userIds.length > 0
			? await supabase
					.from("profiles")
					.select("id, full_name, avatar_url, email")
					.in("id", userIds)
			: {
					data: [] as {
						id: string;
						full_name: string | null;
						avatar_url: string | null;
						email: string | null;
					}[],
				};

	const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

	return {
		success: true,
		data: (requests ?? []).map((r) => ({
			...r,
			profile: profileMap.get(r.user_id),
		})),
	};
}

export async function respondToClassroomRequest(
	requestId: string,
	approve: boolean
): Promise<Result<ClassroomMembershipRequest>> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("respond_to_classroom_request", {
		p_request_id: requestId,
		p_approve: approve,
	});
	if (error) return { success: false, error: error.message };

	revalidatePath(`/d/instructor/classrooms/${data.classroom_id}/edit`);

	return { success: true, data };
}

export async function cancelClassroomRequest(
	requestId: string
): Promise<Result<ClassroomMembershipRequest>> {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("cancel_classroom_request", {
		p_request_id: requestId,
	});
	if (error) return { success: false, error: error.message };

	revalidatePath(`/d/instructor/classrooms/${data.classroom_id}/edit`);

	return { success: true, data };
}
