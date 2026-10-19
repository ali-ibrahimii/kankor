import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	AgencyDetailHeader,
	AgencyDisputesPanel,
	AgencyGrantsEditor,
	AgencyMembersTable,
	type AgencyOverview,
	AgencyOverviewCards,
	AgencySettlementsPanel,
	AgencyTopupsTable,
} from "@/components/blocks/agencies";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { BaseParams } from "@/types/common.types";

export default async function AdminAgencyDetailPage({
	params,
}: {
	params: Promise<BaseParams & { agency_id: string }>;
}) {
	const { locale, agency_id } = await params;
	setRequestLocale(locale);

	const supabase = await createClient();
	const [t, { data: agency }, { data: overview }] = await Promise.all([
		getTranslations("admin.agencies"),
		supabase.from("agencies").select("*").eq("id", agency_id).maybeSingle(),
		supabase.rpc("get_agency_overview", { p_agency_id: agency_id }),
	]);

	if (!agency) notFound();

	return (
		<div className="space-y-6 p-6">
			<AgencyDetailHeader
				agency={agency}
				backHref={routes.d.admin.agencies.page()}
			/>

			{overview && (
				<AgencyOverviewCards overview={overview as unknown as AgencyOverview} />
			)}

			<Tabs defaultValue="grants">
				<TabsList>
					<TabsTrigger value="grants">{t("tabs.grants")}</TabsTrigger>
					<TabsTrigger value="members">{t("tabs.members")}</TabsTrigger>
					<TabsTrigger value="topups">{t("tabs.topups")}</TabsTrigger>
					<TabsTrigger value="settlements">{t("tabs.settlements")}</TabsTrigger>
					<TabsTrigger value="disputes">{t("tabs.disputes")}</TabsTrigger>
				</TabsList>

				<TabsContent value="grants" className="pt-4">
					<AgencyGrantsEditor agencyId={agency.id} />
				</TabsContent>
				<TabsContent value="members" className="pt-4">
					<AgencyMembersTable agencyId={agency.id} canManage canSeatOwner />
				</TabsContent>
				<TabsContent value="topups" className="pt-4">
					<AgencyTopupsTable agencyId={agency.id} />
				</TabsContent>
				<TabsContent value="settlements" className="pt-4">
					<AgencySettlementsPanel agencyId={agency.id} canRecord />
				</TabsContent>
				<TabsContent value="disputes" className="pt-4">
					<AgencyDisputesPanel agencyId={agency.id} mode="admin" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
