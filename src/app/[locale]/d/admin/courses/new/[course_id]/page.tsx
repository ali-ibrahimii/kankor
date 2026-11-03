import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseBuilder } from "@/components/blocks/course-builder";
import { getDashboardPath, isSuperAdmin } from "@/lib/auth/auth.util";
import { getCurrentUser } from "@/lib/auth/session";
import {
	findCourseForBuilder,
	loadBuilderContent,
} from "@/lib/courses/builder-loader";

// ─── Page ─────────────────────────────────────────────────────────────────────
//
// The landing target of "New course" in the admin panel. Without this route the
// dialog sends the admin to /d/admin/courses/new/{id}, which used to 404 — so a
// course could be created but never filled with lessons from the admin side.

export default async function AdminNewCourseBuilderPage({
	params,
}: {
	params: Promise<{ locale: string; course_id: string }>;
}) {
	const { locale, course_id } = await params;

	// Defence in depth: the builder's writes are already gated by
	// can_manage_course, this keeps non-admins out of the admin shell.
	const user = await getCurrentUser();
	if (!user) redirect(`/${locale}/auth/login`);
	// /{locale}/d has no page of its own, so bounce to the dashboard the user
	// actually owns instead of a dead end.
	if (!isSuperAdmin(user)) redirect(getDashboardPath(user, locale));

	const course = await findCourseForBuilder(course_id);
	if (!course) notFound();

	const { modules, lessons, blocks, error } = await loadBuilderContent(
		course.id
	);

	return (
		<CourseBuilder
			courseId={course.id}
			courseTitle={course.title}
			isPublished={course.is_published}
			initialModules={modules}
			initialLessons={lessons}
			initialBlocks={blocks}
			contentError={error}
			basePath="/d/admin"
		/>
	);
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
	params,
}: {
	params: Promise<{ course_id: string }>;
}) {
	const { course_id } = await params;
	const t = await getTranslations("courseBuilder");
	const course = await findCourseForBuilder(course_id);
	return {
		title: course
			? `${t("meta.editCourse")} — ${course.title}`
			: t("meta.newCourse"),
	};
}
