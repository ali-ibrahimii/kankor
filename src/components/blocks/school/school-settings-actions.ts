"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SchoolSettingsValues = {
	name: string;
	address: string;
	provinceId: string;
	adminEmail: string;
};

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Update the school's core info. RLS on `schools` limits writes to whoever
 * can manage the school (owner/admin, or the supervising agency).
 */
export async function updateSchoolSettings(
	schoolId: string,
	values: SchoolSettingsValues
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase
		.from("schools")
		.update({
			name: values.name.trim(),
			address: values.address.trim(),
			province_id: values.provinceId,
			admin_email: values.adminEmail.trim() || null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", schoolId);
	if (error) return { success: false, error: error.message };

	revalidatePath(`/d/school/${schoolId}/settings`);
	revalidatePath(`/d/school/${schoolId}`);
	revalidatePath(`/schools/${schoolId}`);

	return { success: true, data: undefined };
}
