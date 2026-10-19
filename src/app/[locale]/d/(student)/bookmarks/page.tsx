import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookmarksCatalog } from "@/components/blocks/bookmarks";
import { BaseParams } from "@/types/common.types";

export default async function BookmarksPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("bookmarks");

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-xl font-bold">{t("title")}</h1>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{t("description")}
				</p>
			</div>

			<BookmarksCatalog />
		</div>
	);
}
