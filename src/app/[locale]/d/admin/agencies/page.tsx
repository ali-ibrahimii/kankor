import { getTranslations, setRequestLocale } from "next-intl/server";
import { AgenciesTable } from "@/components/blocks/agencies";
import type { BaseParams } from "@/types/common.types";

export default async function AdminAgenciesPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("admin.agencies");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<AgenciesTable />
		</div>
	);
}
