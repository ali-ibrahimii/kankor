import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AgencySchoolsTable } from "@/components/blocks/agencies";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function AgencySchoolsPage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [t, { data: grants }] = await Promise.all([
		getTranslations("dashboard.agency.schools"),
		supabase
			.from("agency_grants")
			.select("permission")
			.eq("agency_id", agency_id)
			.in("permission", ["schools.suspend", "schools.manage"]),
	]);

	// UI-level gate only — every RPC re-checks the grant and scope per call.
	if (!grants || grants.length === 0) {
		redirect(routes.d.agency.page({ agency_id }, undefined, { locale }));
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<AgencySchoolsTable agencyId={agency_id} />
		</div>
	);
}
