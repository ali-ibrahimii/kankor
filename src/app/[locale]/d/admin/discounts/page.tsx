import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiscountsManager } from "@/components/blocks/discounts";
import { BaseParams } from "@/types/common.types";

export default async function AdminDiscountsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("discounts.page");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("adminSubtitle")}
				</p>
			</div>

			<DiscountsManager canCreateGlobal showOwner />
		</div>
	);
}
