import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { normalizeCourseStatus } from "../_lib/course-status";
import { InstructorCoursesView } from "./_components/instructor-courses-view";

export default async function InstructorCoursesPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ status?: string | string[] }>;
}) {
	const { locale } = await params;
	const user = await getCurrentUser();
	if (!user) redirect(routes.auth.login.page(undefined, { locale }));

	// The sidebar links here as ?status=published|draft; unknown values fold
	// into "all" (courses have no archived state — see course-status.ts).
	const status = normalizeCourseStatus((await searchParams).status);

	// key={status}: the client list owns URL-synced filter state, so switching
	// tabs remounts it with a fresh pinned `is_published` scope instead of
	// letting stale nuqs state override the tab.
	return (
		<InstructorCoursesView
			key={status}
			instructorId={user.id}
			status={status}
		/>
	);
}
