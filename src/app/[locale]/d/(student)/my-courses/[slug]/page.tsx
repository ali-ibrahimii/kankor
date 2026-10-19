import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { decodeSlugParam } from "@/lib/utils";
import { CourseDetail } from "@/types/queries.types";
import CourseLearningContent from "./page-content";

// ─── Data fetching ────────────────────────────────────────────────────────────
// get_course_details already embeds the current user's enrollment (via
// auth.uid()), so a single RPC call is enough — no separate enrollments query.

async function fetchCourseDetail(slug: string) {
	const client = await createClient();
	const { data, error } = await client
		.rpc("get_course_details", { p_course_slug: decodeSlugParam(slug) })
		.single();

	if (error) return null;
	return data as CourseDetail;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug: rawSlug } = await params;
	const slug = decodeSlugParam(rawSlug);

	const course = await fetchCourseDetail(slug);
	if (!course) {
		notFound();
	}

	return <CourseLearningContent course={course} slug={slug} />;
}
