import { redirect } from "next/navigation";
import { decodeSlugParam } from "@/lib/utils";

// The learning experience moved to /d/my-courses/[course_id]; keep old lesson
// links working.
export default async function LearnLessonRedirect({
	params,
}: {
	params: Promise<{ locale: string; slug: string; lesson_id: string }>;
}) {
	const { locale, slug: rawSlug, lesson_id } = await params;
	const slug = decodeSlugParam(rawSlug);
	redirect(`/${locale}/d/my-courses/${slug}?lesson=${lesson_id}`);
}
