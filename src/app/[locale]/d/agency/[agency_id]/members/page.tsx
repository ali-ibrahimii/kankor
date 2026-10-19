import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AgencyMembersTable } from "@/components/blocks/agencies";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import type { BaseParams } from "@/types/common.types";

export default async function AgencyMembersPage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const [t, user] = await Promise.all([
		getTranslations("dashboard.agency.members"),
		getCurrentUser(),
	]);

	const membership = user?.agencyMemberships.find(
		(m) => m.agency_id === agency_id
	);
	const canManage =
		membership?.role === "owner" || membership?.role === "admin";

	if (!canManage) {
		redirect(routes.d.agency.page({ agency_id }, undefined, { locale }));
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<AgencyMembersTable agencyId={agency_id} canManage />
		</div>
	);
}
