import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { LibraryCatalog } from "@/components/blocks/libraries";
import { BaseParams } from "@/types/common.types";
import { LibrarySectionResolver } from "./library-section-resolver";

export default async function StudentLibraryPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("libraries");

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<Suspense fallback={<LibraryCatalog fixedCategoryFilter={undefined} />}>
				<LibrarySectionResolver />
			</Suspense>
		</div>
	);
}
