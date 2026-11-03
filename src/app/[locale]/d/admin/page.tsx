import { AdminOverview } from "@/components/blocks/dashboard-overview/admin-overview";
import { createClient } from "@/lib/supabase/server";
import type { PlatformAdminOverview } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(): Promise<PlatformAdminOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_platform_admin_overview")
		.single();
	if (error) throw error;
	return data as unknown as PlatformAdminOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
	const overview = await getOverview();
	return <AdminOverview overview={overview} />;
}
