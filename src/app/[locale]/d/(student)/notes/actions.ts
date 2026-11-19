"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const noteSchema = z.object({
	title: z.string().trim().max(200).optional(),
	content: z.string().trim().min(1).max(20000),
});

export interface StudentNoteRow {
	id: string;
	title: string | null;
	content: string;
	created_at: string;
	updated_at: string;
}

type ActionResult<T = null> =
	| { success: true; data: T }
	| { success: false; error: string };

export async function createStudentNoteAction(input: {
	title?: string;
	content: string;
}): Promise<ActionResult<StudentNoteRow>> {
	const parsed = noteSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: "INVALID_NOTE" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "UNAUTHENTICATED" };
	}

	const { data, error } = await supabase
		.from("notes")
		.insert({
			user_id: user.id,
			title: parsed.data.title || null,
			content: parsed.data.content,
		})
		.select("id, title, content, created_at, updated_at")
		.single();

	if (error || !data) {
		return { success: false, error: error?.message ?? "INSERT_FAILED" };
	}

	revalidatePath("/", "layout");
	return { success: true, data };
}

export async function updateStudentNoteAction(input: {
	id: string;
	title?: string;
	content: string;
}): Promise<ActionResult<StudentNoteRow>> {
	const parsed = noteSchema.safeParse(input);
	if (!parsed.success || !input.id) {
		return { success: false, error: "INVALID_NOTE" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "UNAUTHENTICATED" };
	}

	const { data, error } = await supabase
		.from("notes")
		.update({
			title: parsed.data.title || null,
			content: parsed.data.content,
		})
		.eq("id", input.id)
		.eq("user_id", user.id)
		.select("id, title, content, created_at, updated_at")
		.single();

	if (error || !data) {
		return { success: false, error: error?.message ?? "UPDATE_FAILED" };
	}

	revalidatePath("/", "layout");
	return { success: true, data };
}

export async function deleteStudentNoteAction(
	id: string
): Promise<ActionResult> {
	if (!id) {
		return { success: false, error: "INVALID_ID" };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { success: false, error: "UNAUTHENTICATED" };
	}

	const { error } = await supabase
		.from("notes")
		.delete()
		.eq("id", id)
		.eq("user_id", user.id);

	if (error) {
		return { success: false, error: error.message };
	}

	revalidatePath("/", "layout");
	return { success: true, data: null };
}
