import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchResults } from "@/components/blocks/search/search-results";
import { BasePageProps } from "@/types/common.types";

export async function generateMetadata({
	params,
	searchParams,
}: BasePageProps) {
	const { locale } = await params;
	const { q } = await searchParams;
	const t = await getTranslations({ locale, namespace: "search" });

	return {
		title: q
			? `${t("resultsFor", { query: q })} | Abzar Kankor`
			: `${t("resultsTitle")} | Abzar Kankor`,
		robots: {
			index: false,
			follow: true,
		},
	};
}

export default async function SearchPage({
	params,
	searchParams,
}: BasePageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const { q } = await searchParams;
	const query = q?.trim() ?? "";

	const t = await getTranslations({ locale, namespace: "search" });

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 pb-12 sm:px-6 lg:px-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-slate-900">
					{query ? t("resultsFor", { query }) : t("resultsTitle")}
				</h1>
			</div>

			{query ? (
				<SearchResults initialQuery={query} />
			) : (
				<p className="text-sm text-muted-foreground">{t("emptyQuery")}</p>
			)}
		</div>
	);
}
