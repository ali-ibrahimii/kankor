import { SchoolOverview } from "@/components/blocks/dashboard-overview/school-overview";
import { createClient } from "@/lib/supabase/server";
import type { SchoolDashboardOverview } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(
	schoolId: string
): Promise<SchoolDashboardOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_school_dashboard_overview", { p_school_id: schoolId })
		.single();
	if (error) throw error;
	return data as unknown as SchoolDashboardOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SchoolDashboardPage({
	params,
}: {
	params: Promise<{ school_id: string }>;
}) {
	const { school_id } = await params;
	const overview = await getOverview(school_id);
	return <SchoolOverview overview={overview} />;
}
