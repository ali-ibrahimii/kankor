"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
	SchoolInviteRow,
	SchoolMemberRole,
	SchoolMemberRow,
} from "./members-types";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

export async function inviteSchoolMember(
	schoolId: string,
	email: string,
	role: SchoolMemberRole
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase.rpc("invite_school_member", {
		p_school_id: schoolId,
		p_email: email.trim(),
		p_role: role,
	});
	if (error) return { success: false, error: error.message };

	revalidatePath(`/d/school/${schoolId}/members`);

	return { success: true, data: undefined };
}

export async function listSchoolMembers(
	schoolId: string
): Promise<Result<SchoolMemberRow[]>> {
	const supabase = await createClient();

	const { data: members, error } = await supabase
		.from("school_members")
		.select("id, user_id, role, created_at")
		.eq("school_id", schoolId)
		.order("created_at", { ascending: true });
	if (error) return { success: false, error: error.message };

	const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
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
		data: (members ?? []).map((m) => ({
			...m,
			profile: profileMap.get(m.user_id),
		})),
	};
}

export async function listPendingSchoolInvites(
	schoolId: string
): Promise<Result<SchoolInviteRow[]>> {
	const supabase = await createClient();

	const { data: invites, error } = await supabase
		.from("school_member_invites")
		.select("id, user_id, role, status, created_at")
		.eq("school_id", schoolId)
		.eq("status", "pending")
		.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	const userIds = [...new Set((invites ?? []).map((i) => i.user_id))];
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
		data: (invites ?? []).map((i) => ({
			...i,
			profile: profileMap.get(i.user_id),
		})),
	};
}
