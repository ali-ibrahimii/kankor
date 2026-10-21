import { InstructorOverview } from "@/components/blocks/dashboard-overview/instructor-overview";
import { createClient } from "@/lib/supabase/server";
import type { InstructorDashboardOverview } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(): Promise<InstructorDashboardOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_instructor_dashboard_overview")
		.single();
	if (error) throw error;
	return data as unknown as InstructorDashboardOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstructorDashboardPage() {
	const overview = await getOverview();
	return <InstructorOverview overview={overview} />;
}
