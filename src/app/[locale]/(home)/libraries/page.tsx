import { LibraryBig } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogHero } from "@/components/blocks/course/catalog-hero";
import { LibraryCatalog } from "@/components/blocks/libraries/library-catalog";
import { BOOK_SELECT } from "@/components/blocks/libraries/types";
import { getQueryFilterData } from "@/hooks/filter/filter.server";
import { BaseParams } from "@/types/common.types";

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "libraries" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function LibrariesPage({
	params,
	searchParams,
}: {
	params: Promise<BaseParams>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "libraries" });
	const hero = await getTranslations({
		locale,
		namespace: "catalogHeroes.libraries",
	});

	const initialData = await getQueryFilterData(searchParams, "libraries", {
		name: "libraries",
		selectColumns: BOOK_SELECT,
		searchColumns: ["title", "desc"],
		defaultSort: [{ field: "updated_at", direction: "desc" }],
		defaultPagination: { page: 1, pageSize: 12 },
	});

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 mt-12 sm:px-6 lg:px-8">
			<CatalogHero
				badge={hero("badge")}
				title={t("title")}
				description={t("description")}
				chips={hero.raw("chips") as string[]}
				icon={LibraryBig}
			/>

			<LibraryCatalog initialData={initialData as any} />
		</div>
	);
}
