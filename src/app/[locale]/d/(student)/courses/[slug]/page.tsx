import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam } from "@/lib/utils";
import { CourseDetail } from "@/types/queries.types";
import CourseDetailClient from "./course-detail-client";

// ─── Data fetching ────────────────────────────────────────────────────────────
// get_course_details already embeds the current user's enrollment (via
// auth.uid()), so a single RPC call is enough — no separate enrollments query.

async function fetchStudentCourseDetail(slug: string) {
	const client = await createClient();
	const { data, error } = await client
		.rpc("get_course_details", { p_course_slug: decodeSlugParam(slug) })
		.single();

	if (error) throw error;
	return data as CourseDetail;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentCourseDetailPage({
	params,
}: {
	params: Promise<{ slug: string; locale: string }>;
}) {
	const { slug: slug, locale } = await params;
	setRequestLocale(locale);

	const user = await getCurrentUser();
	if (!user) {
		redirect(`/auth/login?next=/d/courses/${slug}`);
	}

	try {
		const course = await fetchStudentCourseDetail(slug);
		if (!course) {
			notFound();
		}

		return (
			<CourseDetailClient
				courseId={course.id}
				userId={user.id}
				course={course}
			/>
		);
	} catch (error) {
		console.error("Failed to load course detail:", error);
		notFound();
	}
}
