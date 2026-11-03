import { getTranslations } from "next-intl/server";
import { Spinner } from "@/components/ui/spinner";

// While the builder compiles/loads, show something instead of a blank shell.
export default async function AdminCoursesLoading() {
	const t = await getTranslations("courseBuilder");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
			<Spinner className="size-6" />
			<p className="text-sm">{t("loading")}</p>
		</div>
	);
}
