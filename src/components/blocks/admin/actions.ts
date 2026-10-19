"use server";

import type { Database, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { AccountStatus } from "./status.utils";

type Result<T = null> =
	| { success: true; data: T }
	| { success: false; error: string };

type SchoolMemberRole = Database["public"]["Enums"]["school_member_role"];

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

// ─── Instructor management ───────────────────────────────────────────────────
// Authorization is enforced by RLS ("Admins can update any profile").

export async function setInstructorStatus(
	instructorId: string,
	status: AccountStatus
): Promise<Result<Pick<Tables<"profiles">, "id" | "instructor_status">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("profiles")
		.update({ instructor_status: status })
		.eq("id", instructorId)
		.eq("role", "instructor")
		.select("id, instructor_status")
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── Student management ──────────────────────────────────────────────────────
// Authorization is enforced by RLS ("Admins can update any profile").

export async function setStudentStatus(
	studentId: string,
	status: AccountStatus
): Promise<Result<Pick<Tables<"profiles">, "id" | "student_status">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("profiles")
		.update({ student_status: status })
		.eq("id", studentId)
		.eq("role", "student")
		.select("id, student_status")
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── School management ───────────────────────────────────────────────────────
// Authorization is enforced by RLS ("Admins can update any school").

export async function setSchoolStatus(
	schoolId: string,
	status: AccountStatus
): Promise<Result<Pick<Tables<"schools">, "id" | "status">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("schools")
		.update({ status })
		.eq("id", schoolId)
		.select("id, status")
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── School members ──────────────────────────────────────────────────────────

export async function setSchoolMemberRole(
	memberId: string,
	role: SchoolMemberRole
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("school_members")
		.update({ role })
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

export async function removeSchoolMember(memberId: string): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("school_members")
		.delete()
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

// ─── Content management (courses / decks / quizzes) ─────────────────────────

export async function setCoursePublished(
	courseId: string,
	isPublished: boolean
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase.rpc("set_course_published_status", {
		p_course_id: courseId,
		p_is_published: isPublished,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

export async function deleteContentItem(
	table: "courses" | "decks" | "quizzes",
	id: string
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase.from(table).delete().eq("id", id);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

// ─── User Role Modification ──────────────────────────────────────────────────
// Enforced by RLS and RPC ("Admins can update any profile").

export async function setUserRole(
	userId: string,
	role: Database["public"]["Enums"]["user_role"]
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase.rpc("admin_update_user_role", {
		p_user_id: userId,
		p_new_role: role,
	});

	if (error) return { success: false, error: error.message };

	// Ensure target status is set to active when role transitions
	if (role === "instructor") {
		await supabase
			.from("profiles")
			.update({ instructor_status: "active" })
			.eq("id", userId);
	} else if (role === "student") {
		await supabase
			.from("profiles")
			.update({ student_status: "active" })
			.eq("id", userId);
	}

	return { success: true, data: null };
}
