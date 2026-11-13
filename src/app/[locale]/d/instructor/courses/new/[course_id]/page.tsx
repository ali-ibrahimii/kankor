import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseBuilder } from "@/components/blocks/course-builder";
import { loadBuilderContent } from "@/lib/courses/builder-loader";
import { routes } from "@/lib/routes";
import { findInstructorCourse } from "../../../_lib/instructor-data";

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CourseBuilderPage({
	params,
}: {
	params: Promise<{ course_id: string }>;
}) {
	const { course_id } = await params;

	// Ownership check (RLS + super-admin rule) — a foreign or missing id is a
	// 404 inside the instructor shell, never someone else's builder.
	const course = await findInstructorCourse(course_id);
	if (!course) notFound();

	// Content may fail to load even when the course row is fine; the builder
	// shows a banner and keeps editing the details possible (admin parity).
	const content = await loadBuilderContent(course.id);

	return (
		<CourseBuilder
			courseId={course.id}
			courseTitle={course.title}
			courseSlug={course.slug}
			isPublished={course.is_published}
			initialModules={content.modules}
			initialLessons={content.lessons}
			initialBlocks={content.blocks}
			contentError={content.error}
			basePath={routes.d.instructor.page()}
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
	const course = await findInstructorCourse(course_id);
	return {
		title: course
			? `${t("meta.editCourse")} — ${course.title}`
			: t("meta.newCourse"),
	};
}
