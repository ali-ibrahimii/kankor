import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AgencyInstructorsTable } from "@/components/blocks/agencies";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function AgencyInstructorsPage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [t, { data: grant }] = await Promise.all([
		getTranslations("dashboard.agency.instructors"),
		supabase
			.from("agency_grants")
			.select("id")
			.eq("agency_id", agency_id)
			.eq("permission", "instructors.suspend")
			.maybeSingle(),
	]);

	// UI-level gate only — the RPC re-checks the grant and scope per call.
	if (!grant) {
		redirect(routes.d.agency.page({ agency_id }, undefined, { locale }));
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<AgencyInstructorsTable agencyId={agency_id} />
		</div>
	);
}
