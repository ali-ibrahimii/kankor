import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseBuilder } from "@/components/blocks/course-builder";
import { loadCourseContent } from "@/components/blocks/course-builder/actions";
import { createClient } from "@/lib/supabase/server";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchCourse(courseId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("courses")
		.select("id, title, is_published, instructor_id")
		.eq("id", courseId)
		.single();
	if (error || !data) return null;
	return data;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CourseBuilderPage({
	params,
}: {
	params: Promise<{ course_id: string }>;
}) {
	const { course_id } = await params;

	const [course, contentResult] = await Promise.all([
		fetchCourse(course_id),
		loadCourseContent(course_id),
	]);

	if (!course) notFound();
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
			basePath="/d/instructor"
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
	const course = await fetchCourse(course_id);
	return {
		title: course
			? `${t("meta.editCourse")} — ${course.title}`
			: t("meta.newCourse"),
	};
}
