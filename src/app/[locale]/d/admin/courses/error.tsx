"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// A crash inside the course builder used to leave the admin looking at a blank
// panel with no explanation. This turns it into a readable message plus a
// retry, and keeps the underlying reason visible for debugging.
export default function AdminCoursesError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const t = useTranslations("courseBuilder");

	useEffect(() => {
		console.error("[admin/courses] unhandled error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
			<div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10">
				<AlertTriangle className="size-7" />
			</div>
			<div className="max-w-md space-y-1.5">
				<h2 className="text-base font-bold">{t("errorTitle")}</h2>
				<p className="text-sm text-muted-foreground">{t("errorDescription")}</p>
				<p className="break-words font-mono text-[11px] text-muted-foreground/70">
					{error.message}
				</p>
			</div>
			<div className="flex gap-2">
				<Button onClick={reset}>{t("retry")}</Button>
				<Button variant="outline" asChild>
					<Link href="/d/admin/courses">{t("backToCourses")}</Link>
				</Button>
			</div>
		</div>
	);
}
