"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export function SegmentErrorView({
	error,
	reset,
	backHref = routes.home.page(),
	useDashboardLabel = false,
	scope = "app",
}: {
	error: Error & { digest?: string };
	reset: () => void;
	backHref?: string;
	useDashboardLabel?: boolean;
	scope?: string;
}) {
	const t = useTranslations("common.errorPage");

	useEffect(() => {
		console.error(`[${scope}] unhandled error:`, error);
	}, [error, scope]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
			<div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
				<AlertTriangle className="size-7" />
			</div>
			<div className="max-w-md space-y-2">
				<h1 className="text-xl font-extrabold tracking-tight text-foreground">
					{t("title")}
				</h1>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{t("description")}
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2.5">
				<Button onClick={reset} className="rounded-full px-5">
					{t("retry")}
				</Button>
				<Button variant="outline" asChild className="rounded-full px-5">
					<Link href={backHref}>
						{useDashboardLabel ? t("goDashboard") : t("goHome")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
