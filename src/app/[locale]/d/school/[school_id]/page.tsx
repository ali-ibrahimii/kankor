import { SchoolOverview } from "@/components/blocks/dashboard-overview/school-overview";
import { SchoolBrandingCard } from "@/components/blocks/school/school-branding-card";
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

type SchoolBranding = {
	cover_image_url: string | null;
	logo_url: string | null;
};

/**
 * Cover/logo live on `schools`; the row is only visible here when RLS allows
 * the caller to manage it, which doubles as the `canEdit` flag for the card.
 */
async function getSchoolBranding(
	schoolId: string
): Promise<SchoolBranding | null> {
	const supabase = await createClient();
	const { data } = await supabase
		.from("schools")
		.select("cover_image_url, logo_url")
		.eq("id", schoolId)
		.maybeSingle();
	return data ?? null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SchoolDashboardPage({
	params,
}: {
	params: Promise<{ school_id: string }>;
}) {
	const { school_id } = await params;
	const [overview, branding] = await Promise.all([
		getOverview(school_id),
		getSchoolBranding(school_id),
	]);

	return (
		<div className="space-y-6 p-6">
			<SchoolOverview overview={overview} />
			<SchoolBrandingCard
				schoolId={school_id}
				initialCover={branding?.cover_image_url ?? null}
				initialLogo={branding?.logo_url ?? null}
				canEdit={Boolean(branding)}
			/>
		</div>
	);
}
