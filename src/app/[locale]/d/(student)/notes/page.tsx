import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";
import type { StudentNoteRow } from "./actions";
import { StudentNotesClient } from "./notes-client";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "studentNotes" });
	return {
		title: t("title"),
		description: t("description"),
	};
}

async function fetchStudentNotes(userId: string): Promise<StudentNoteRow[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("notes")
		.select("id, title, content, created_at, updated_at")
		.eq("user_id", userId)
		.order("updated_at", { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export default async function StudentNotesPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const user = await getCurrentUser();
	const notes = user ? await fetchStudentNotes(user.id) : [];

	return <StudentNotesClient initialNotes={notes} />;
}
