import { getTranslations, setRequestLocale } from "next-intl/server";
import { AgencyDisputesPanel } from "@/components/blocks/agencies";
import type { BaseParams } from "@/types/common.types";

export default async function AgencyDisputesPage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("dashboard.agency.disputes");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<AgencyDisputesPanel agencyId={agency_id} mode="agency" />
		</div>
	);
}
