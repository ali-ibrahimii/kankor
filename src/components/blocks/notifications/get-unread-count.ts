import { createClient } from "@/lib/supabase/server";

export async function getUnreadNotificationCount(
	userId: string
): Promise<number> {
	const supabase = await createClient();
	const { count } = await supabase
		.from("notifications")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId)
		.eq("is_read", false);

	return count ?? 0;
}
