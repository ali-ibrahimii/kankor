import { getTranslations } from "next-intl/server";
import { Spinner } from "@/components/ui/spinner";

// While the builder's server component streams in (auth + course + content
// queries), show a localized spinner instead of the heavy shared splash.
export default async function CourseBuilderRouteLoading() {
	const t = await getTranslations("loading");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
			<Spinner className="size-6" />
			<p className="text-sm">{t("title")}</p>
		</div>
	);
}
