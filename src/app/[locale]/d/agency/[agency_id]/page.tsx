import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	type AgencyOverview,
	AgencyOverviewCards,
	AgencyTopupsTable,
} from "@/components/blocks/agencies";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function AgencyOverviewPage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [t, { data: overview }] = await Promise.all([
		getTranslations("dashboard.agency"),
		supabase.rpc("get_agency_overview", { p_agency_id: agency_id }),
	]);

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("overview.title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("overview.subtitle")}
				</p>
			</div>

			{overview && (
				<AgencyOverviewCards overview={overview as unknown as AgencyOverview} />
			)}

			<div>
				<h2 className="mb-3 font-semibold">{t("overview.recentTopups")}</h2>
				<AgencyTopupsTable agencyId={agency_id} />
			</div>
		</div>
	);
}
