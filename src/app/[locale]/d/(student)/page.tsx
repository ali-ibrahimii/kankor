import { StudentOverview } from "@/components/blocks/dashboard-overview/student-overview";
import { createClient } from "@/lib/supabase/server";
import type { StudentDashboardOverview } from "@/types/queries.types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOverview(): Promise<StudentDashboardOverview | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.rpc("get_student_dashboard_overview")
		.single();
	if (error) throw error;
	return data as unknown as StudentDashboardOverview;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentDashboardPage() {
	const overview = await getOverview();
	return <StudentOverview overview={overview} />;
}
