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
// Admin course builder, addressed by slug (or id — see findCourseForBuilder).

export default async function AdminCourseBuilderPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;

	// The builder writes through can_manage_course(), but a non-admin should
	// never land inside the admin shell in the first place.
	const user = await getCurrentUser();
	if (!user) redirect(`/${locale}/auth/login`);
	if (!isSuperAdmin(user)) redirect(getDashboardPath(user, locale));

	const course = await findCourseForBuilder(slug);
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
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const t = await getTranslations("courseBuilder");
	const course = await findCourseForBuilder(slug);
	return {
		title: course
			? `${t("meta.editCourse")} — ${course.title}`
			: t("meta.newCourse"),
	};
}
