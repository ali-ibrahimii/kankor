import { getTranslations, setRequestLocale } from "next-intl/server";
import { SchoolsTable } from "@/components/blocks/admin";
import type { BaseParams } from "@/types/common.types";

export default async function AdminSchoolsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("admin.schools");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<SchoolsTable />
		</div>
	);
}
