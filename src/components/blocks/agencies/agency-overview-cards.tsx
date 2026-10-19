"use client";

import { useTranslations } from "next-intl";
import type { AgencyOverview } from "./actions";

/** Aggregate stat cards for the agency dashboard and admin detail page. */
export function AgencyOverviewCards({
	overview,
}: {
	overview: AgencyOverview;
}) {
	const t = useTranslations("dashboard.agency.overview");

	const cards: {
		key: string;
		label: string;
		value: string;
		alert?: boolean;
	}[] = [
		{
			key: "charged",
			label: t("chargedTotal"),
			value: overview.charged_total.toLocaleString(),
		},
		{
			key: "outstanding",
			label: t("outstanding"),
			value: `${overview.outstanding.toLocaleString()} / ${overview.liability_limit.toLocaleString()}`,
			alert: overview.outstanding >= overview.liability_limit,
		},
		{
			key: "students",
			label: t("studentsCharged"),
			value: overview.students_charged.toLocaleString(),
		},
		{
			key: "last30",
			label: t("chargedLast30d"),
			value: overview.charged_last_30d.toLocaleString(),
		},
		{
			key: "commission",
			label: t("commissionEarned"),
			value: overview.commission_earned.toLocaleString(),
		},
		{
			key: "disputes",
			label: t("openDisputes"),
			value: overview.open_disputes.toLocaleString(),
			alert: overview.open_disputes > 0,
		},
		{
			key: "sales",
			label: t("salesTotal"),
			value: `${(overview.sales_total ?? 0).toLocaleString()} (${(overview.sales_count ?? 0).toLocaleString()})`,
		},
	];

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
			{cards.map((card) => (
				<div key={card.key} className="rounded-lg border p-4">
					<p className="text-sm text-muted-foreground">{card.label}</p>
					<p
						className={`mt-1 text-2xl font-semibold tabular-nums ${
							card.alert ? "text-destructive" : ""
						}`}
					>
						{card.value}
					</p>
				</div>
			))}
		</div>
	);
}
