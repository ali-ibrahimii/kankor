import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

// Without this file `notFound()` fell through to Next's bare default 404,
// which inside the instructor shell looks like "the page did not render at
// all". This catches every notFound() under /d/instructor (unknown course
// slug, foreign course, deleted quiz, …).
export default async function InstructorNotFound() {
	const t = await getTranslations("courseBuilder");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
			<div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<FileQuestion className="size-7" />
			</div>
			<div className="max-w-md space-y-1.5">
				<h2 className="text-base font-bold">{t("notFoundTitle")}</h2>
				<p className="text-sm text-muted-foreground">
					{t("notFoundDescription")}
				</p>
			</div>
			<Button asChild>
				<Link href={routes.d.instructor.courses.page()}>
					{t("backToCourses")}
				</Link>
			</Button>
		</div>
	);
}
