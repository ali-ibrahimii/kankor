import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChargeStudentForm } from "@/components/blocks/agencies";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function AgencyChargePage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [t, { data: grant }] = await Promise.all([
		getTranslations("dashboard.agency.charge"),
		supabase
			.from("agency_grants")
			.select("id")
			.eq("agency_id", agency_id)
			.eq("permission", "students.charge")
			.maybeSingle(),
	]);

	// UI-level gate only — the RPC re-checks the grant (and scope) on every
	// call, so removing this page's guard would not grant anything.
	if (!grant) {
		redirect(routes.d.agency.page({ agency_id }, undefined, { locale }));
	}

	return (
		<div className="mx-auto w-full max-w-xl space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<ChargeStudentForm agencyId={agency_id} />
		</div>
	);
}
