import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiscountsManager } from "@/components/blocks/discounts";
import { BaseParams } from "@/types/common.types";

export default async function SchoolDiscountsPage({
	params,
}: {
	params: Promise<BaseParams & { school_id: string }>;
}) {
	const { school_id, locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("discounts.page");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<DiscountsManager owner={{ schoolId: school_id }} />
		</div>
	);
}
