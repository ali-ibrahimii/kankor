import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export async function SegmentNotFoundView({
	backHref = routes.home.page(),
	useDashboardLabel = false,
}: {
	backHref?: string;
	useDashboardLabel?: boolean;
}) {
	const t = await getTranslations("common.notFoundPage");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
			<div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<FileQuestion className="size-7" />
			</div>
			<div className="max-w-md space-y-2">
				<p className="text-xs font-bold tracking-widest text-primary uppercase">
					{t("code")}
				</p>
				<h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
					{t("title")}
				</h1>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{t("description")}
				</p>
			</div>
			<Button asChild className="rounded-full px-6">
				<Link href={backHref}>
					{useDashboardLabel ? t("goDashboard") : t("goHome")}
				</Link>
			</Button>
		</div>
	);
}
