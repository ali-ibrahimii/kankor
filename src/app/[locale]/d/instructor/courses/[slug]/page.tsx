import { notFound } from "next/navigation";
import { loadBuilderContent } from "@/lib/courses/builder-loader";
import {
	type CourseCardStats,
	findInstructorCourse,
	getCourseCardStats,
	getCourseReviewBreakdown,
	getCourseStudents,
} from "../../_lib/instructor-data";
import { CourseDetailView } from "./_components/course-detail";

const EMPTY_STATS: CourseCardStats = {
	course_id: "",
	lessons_count: 0,
	lessons_minutes: 0,
	enrollments_count: 0,
};

export default async function InstructorCourseDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	// Slug or id, own course only (super-admins see all) — anything else is a
	// 404 inside the instructor shell, not an empty management page.
	const course = await findInstructorCourse(slug);
	if (!course) notFound();

	const [content, statsRows, students, breakdown] = await Promise.all([
		loadBuilderContent(course.id),
		getCourseCardStats([course.id]),
		getCourseStudents(course.id),
		getCourseReviewBreakdown(course.id),
	]);

	return (
		<CourseDetailView
			course={course}
			stats={statsRows[0] ?? { ...EMPTY_STATS, course_id: course.id }}
			students={students}
			breakdown={breakdown}
			modules={content.modules}
			lessons={content.lessons}
			contentError={content.error}
		/>
	);
}
