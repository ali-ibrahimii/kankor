import { getTranslations, setRequestLocale } from "next-intl/server";
import { InstructorsTable } from "@/components/blocks/admin";
import type { BaseParams } from "@/types/common.types";

export default async function AdminInstructorsPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("admin.instructors");

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			</div>

			<InstructorsTable />
		</div>
	);
}
