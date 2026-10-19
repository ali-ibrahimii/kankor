import { getTranslations, setRequestLocale } from "next-intl/server";
import { EarningsView, getSellerEarnings } from "@/components/blocks/credits";
import { BaseParams } from "@/types/common.types";

export default async function SchoolEarningsPage({
	params,
}: {
	params: Promise<BaseParams & { school_id: string }>;
}) {
	const { school_id, locale } = await params;
	setRequestLocale(locale);

	const result = await getSellerEarnings({ schoolId: school_id });
	const t = await getTranslations("credits.earnings");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<EarningsView
				totalCredits={result.success ? result.data.totalCredits : 0}
				sales={result.success ? result.data.sales : []}
			/>
		</div>
	);
}
