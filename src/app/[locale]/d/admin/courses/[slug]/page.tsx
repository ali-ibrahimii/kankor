import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseBuilder } from "@/components/blocks/course-builder";
import { loadCourseContent } from "@/components/blocks/course-builder/actions";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam, getSlugOrIdColumn } from "@/lib/utils";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCourse(rawSlug: string) {
	const identifier = decodeSlugParam(rawSlug);
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("courses")
		.select("id, title, is_published, instructor_id")
		.eq(getSlugOrIdColumn(identifier), identifier)
		.single();
	if (error || !data) return null;
	return data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCourseBuilderPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const course = await fetchCourse(slug);
	if (!course) notFound();

	const contentResult = await loadCourseContent(course.id);
	if (!contentResult.success) notFound();

	const { modules, lessons, blocks } = contentResult.data;

	return (
		<CourseBuilder
			courseId={course.id}
			courseTitle={course.title}
			isPublished={course.is_published}
			initialModules={modules}
			initialLessons={lessons}
			initialBlocks={blocks}
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
	const course = await fetchCourse(slug);
	return {
		title: course
			? `${t("meta.editCourse")} — ${course.title}`
			: t("meta.newCourse"),
	};
}
