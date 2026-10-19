"use server";

import { revalidatePath } from "next/cache";
import { defaultLocale, Locale } from "@/i18n";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type {
	DraftContentBlock,
	DraftLesson,
	DraftModule,
	NewCourseFormValues,
} from "./types";

// ─── Result type ──────────────────────────────────────────────────────────────

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

// ─── Create course ────────────────────────────────────────────────────────────

export async function createCourse(
	values: NewCourseFormValues,
	/** When set, the course is owned by (and attributed to) this agency — RLS
	 * requires the caller to hold `courses.manage_own` for it. */
	agencyId?: string
): Promise<Result<{ courseId: string }>> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("courses")
		.insert({
			agency_id: agencyId ?? null,
			title: values.title,
			subtitle: values.subtitle || null,
			description: values.description || null,
			language: (values.language as Locale) || defaultLocale,
			level:
				(values.level as
					| "beginner"
					| "intermediate"
					| "advanced"
					| "all_levels") || null,
			is_free: values.is_free,
			price_credits: values.is_free
				? 0
				: values.price_credits
					? Number(values.price_credits)
					: 0,
			visibility: values.visibility,
			is_published: false,
			instructor_id: user.id,
			related_decks_ids: values.related_decks_ids || [],
			related_quizzes_ids: values.related_quizzes_ids || [],
			related_libraries_ids: values.related_libraries_ids || [],
			book_id: values.book_id || null,
			subject_id: values.subject_id || null,
			grade_id: values.grade_id || null,
		})
		.select("id")
		.single();

	if (error) return { success: false, error: error.message };

	revalidatePath("/d/instructor/courses");
	revalidatePath("/d/admin/courses");

	return { success: true, data: { courseId: data.id } };
}

// ─── Fetch course details for editing ─────────────────────────────────────────

export async function getCourseForEdit(
	courseId: string
): Promise<Result<NewCourseFormValues>> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("courses")
		.select(
			"title, subtitle, description, language, level, is_free, price_credits, visibility, related_decks_ids, related_quizzes_ids, related_libraries_ids, book_id, subject_id, grade_id"
		)
		.eq("id", courseId)
		.single();
	if (error || !data) {
		return { success: false, error: error?.message ?? "Course not found" };
	}

	return {
		success: true,
		data: {
			title: data.title,
			subtitle: data.subtitle ?? "",
			description: data.description ?? "",
			language: data.language,
			level: data.level ?? "all_levels",
			is_free: data.is_free ?? true,
			price_credits: data.price_credits ? String(data.price_credits) : "",
			visibility: data.visibility,
			related_decks_ids: data.related_decks_ids || [],
			related_quizzes_ids: data.related_quizzes_ids || [],
			related_libraries_ids: data.related_libraries_ids || [],
			book_id: data.book_id,
			subject_id: data.subject_id,
			grade_id: data.grade_id,
		},
	};
}

// ─── Update course details ─────────────────────────────────────────────────────

export async function updateCourse(
	courseId: string,
	values: NewCourseFormValues
): Promise<Result> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("courses")
		.update({
			title: values.title,
			subtitle: values.subtitle || null,
			description: values.description || null,
			language: (values.language as Locale) || defaultLocale,
			level:
				(values.level as
					| "beginner"
					| "intermediate"
					| "advanced"
					| "all_levels") || null,
			is_free: values.is_free,
			price_credits: values.is_free
				? 0
				: values.price_credits
					? Number(values.price_credits)
					: 0,
			visibility: values.visibility,
			related_decks_ids: values.related_decks_ids || [],
			related_quizzes_ids: values.related_quizzes_ids || [],
			related_libraries_ids: values.related_libraries_ids || [],
			book_id: values.book_id || null,
			subject_id: values.subject_id || null,
			grade_id: values.grade_id || null,
		})
		.eq("id", courseId)
		.select("id, slug")
		.single();

	if (error) return { success: false, error: error.message };

	const courseSlug = data?.slug ?? courseId;
	revalidatePath(routes.d.instructor.courses.new.page({ course_id: courseId }));
	revalidatePath(routes.d.instructor.courses.page());
	revalidatePath(routes.d.instructor.courses.slug.page({ slug: courseSlug }));
	revalidatePath(routes.courses.slug.page({ slug: courseSlug }));

	return { success: true, data: undefined };
}

// ─── Load course content for editing ─────────────────────────────────────────

export async function loadCourseContent(courseId: string): Promise<
	Result<{
		modules: DraftModule[];
		lessons: DraftLesson[];
		blocks: DraftContentBlock[];
	}>
> {
	const supabase = await createClient();

	const [modulesRes, lessonsRes] = await Promise.all([
		supabase
			.from("modules")
			.select("*")
			.eq("course_id", courseId)
			.order("order_index"),
		supabase
			.from("lessons")
			.select("*")
			.eq("course_id", courseId)
			.order("order_index"),
	]);

	if (modulesRes.error)
		return { success: false, error: modulesRes.error.message };
	if (lessonsRes.error)
		return { success: false, error: lessonsRes.error.message };

	const lessonIds = (lessonsRes.data ?? []).map((l) => l.id);

	let blockRows: Array<Record<string, unknown>> = [];
	if (lessonIds.length > 0) {
		const blocksRes = await supabase
			.from("lesson_content_blocks")
			.select("*")
			.in("lesson_id", lessonIds)
			.order("order_index");
		if (blocksRes.error)
			return { success: false, error: blocksRes.error.message };
		blockRows = (blocksRes.data ?? []) as Array<Record<string, unknown>>;
	}

	return {
		success: true,
		data: {
			modules: (modulesRes.data ?? []).map((m) => ({
				id: m.id,
				course_id: m.course_id ?? courseId,
				title: m.title,
				description: m.description ?? null,
				order_index: m.order_index,
				start_page: m.start_page ?? null,
				end_page: m.end_page ?? null,
			})),
			lessons: (lessonsRes.data ?? []).map((l) => ({
				id: l.id,
				module_id: l.module_id ?? null,
				course_id: l.course_id ?? courseId,
				title: l.title,
				description: l.description ?? null,
				content_type: l.content_type,
				order_index: l.order_index,
				is_previewable: l.is_previewable ?? false,
				is_mandatory: l.is_mandatory ?? true,
				estimated_duration_minutes: l.estimated_duration_minutes ?? null,
				slug: l.slug ?? null,
			})),
			blocks: blockRows.map((b) => ({
				id: b.id as string,
				lesson_id: (b.lesson_id as string | null) ?? null,
				course_id: (b.course_id as string | null) ?? courseId,
				block_type: b.block_type as DraftContentBlock["block_type"],
				order_index: b.order_index as number,
				text_content: (b.text_content as string | null) ?? null,
				video_url: (b.video_url as string | null) ?? null,
				video_provider: (b.video_provider as string | null) ?? null,
				video_transcript: (b.video_transcript as string | null) ?? null,
				video_storage_key: (b.video_storage_key as string | null) ?? null,
				audio_url: (b.audio_url as string | null) ?? null,
				audio_transcript: (b.audio_transcript as string | null) ?? null,
				audio_storage_key: (b.audio_storage_key as string | null) ?? null,
				document_url: (b.document_url as string | null) ?? null,
				document_storage_key: (b.document_storage_key as string | null) ?? null,
				image_url: (b.image_url as string | null) ?? null,
				code_language: (b.code_language as string | null) ?? null,
				default_code: (b.default_code as string | null) ?? null,
				solution_code: (b.solution_code as string | null) ?? null,
				external_resource_url:
					(b.external_resource_url as string | null) ?? null,
				external_resource_title:
					(b.external_resource_title as string | null) ?? null,
				playlist: (b.playlist as string | null) ?? null,
				slug: (b.slug as string | null) ?? null,
			})),
		},
	};
}

// ─── Save course content ──────────────────────────────────────────────────────

export async function saveCourseContent(
	courseId: string,
	modules: DraftModule[],
	lessons: DraftLesson[],
	blocks: DraftContentBlock[]
): Promise<Result> {
	const supabase = await createClient();

	try {
		// ── Modules ──────────────────────────────────────────────────────────────

		const deletedModuleIds = modules
			.filter((m) => m._deleted && !m._isNew)
			.map((m) => m.id);
		const activeModules = modules.filter((m) => !m._deleted);

		if (deletedModuleIds.length > 0) {
			const { error } = await supabase
				.from("modules")
				.delete()
				.in("id", deletedModuleIds);
			if (error) throw new Error(error.message);
		}

		if (activeModules.length > 0) {
			const { error } = await supabase.from("modules").upsert(
				activeModules.map((m) => ({
					id: m.id,
					course_id: m.course_id,
					title: m.title,
					description: m.description,
					order_index: m.order_index,
					start_page: m.start_page,
					end_page: m.end_page,
				})),
				{ onConflict: "id" }
			);
			if (error) throw new Error(error.message);
		}

		// ── Lessons ───────────────────────────────────────────────────────────────

		const deletedLessonIds = lessons
			.filter((l) => l._deleted && !l._isNew)
			.map((l) => l.id);
		const activeLessons = lessons.filter((l) => !l._deleted);

		if (deletedLessonIds.length > 0) {
			const { error } = await supabase
				.from("lessons")
				.delete()
				.in("id", deletedLessonIds);
			if (error) throw new Error(error.message);
		}

		if (activeLessons.length > 0) {
			const { error } = await supabase.from("lessons").upsert(
				activeLessons.map((l) => ({
					id: l.id,
					module_id: l.module_id,
					course_id: l.course_id ?? courseId,
					title: l.title,
					description: l.description,
					content_type: l.content_type,
					order_index: l.order_index,
					is_previewable: l.is_previewable,
					is_mandatory: l.is_mandatory,
					estimated_duration_minutes: l.estimated_duration_minutes,
					slug: l.slug,
				})),
				{ onConflict: "id" }
			);
			if (error) throw new Error(error.message);
		}

		// ── Content blocks ────────────────────────────────────────────────────────

		const deletedBlockIds = blocks
			.filter((b) => b._deleted && !b._isNew)
			.map((b) => b.id);
		const activeBlocks = blocks.filter((b) => !b._deleted);

		if (deletedBlockIds.length > 0) {
			const { error } = await supabase
				.from("lesson_content_blocks")
				.delete()
				.in("id", deletedBlockIds);
			if (error) throw new Error(error.message);
		}

		if (activeBlocks.length > 0) {
			const { error } = await supabase.from("lesson_content_blocks").upsert(
				activeBlocks.map((b) => ({
					id: b.id,
					lesson_id: b.lesson_id,
					course_id: b.course_id ?? courseId,
					block_type: b.block_type,
					order_index: b.order_index,
					text_content: b.text_content,
					video_url: b.video_url,
					video_provider: b.video_provider,
					video_transcript: b.video_transcript,
					video_storage_key: b.video_storage_key,
					audio_url: b.audio_url,
					audio_transcript: b.audio_transcript,
					audio_storage_key: b.audio_storage_key,
					document_url: b.document_url,
					document_storage_key: b.document_storage_key,
					image_url: b.image_url,
					code_language: b.code_language,
					default_code: b.default_code,
					solution_code: b.solution_code,
					external_resource_url: b.external_resource_url,
					external_resource_title: b.external_resource_title,
					playlist: b.playlist,
					slug: b.slug,
				})),
				{ onConflict: "id" }
			);
			if (error) throw new Error(error.message);
		}

		const { data: courseRow } = await supabase
			.from("courses")
			.select("slug")
			.eq("id", courseId)
			.single();
		const courseSlug = courseRow?.slug ?? courseId;

		revalidatePath(routes.courses.slug.page({ slug: courseSlug }));
		revalidatePath(routes.d.instructor.courses.slug.page({ slug: courseSlug }));
		revalidatePath(
			routes.d.instructor.courses.new.page({ course_id: courseId })
		);
		revalidatePath(routes.d.instructor.courses.page());

		return { success: true, data: undefined };
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

// ─── Publish / unpublish ──────────────────────────────────────────────────────

export async function setCoursePublished(
	courseId: string,
	isPublished: boolean
): Promise<Result> {
	const supabase = await createClient();

	const { data: updatedCourse, error } = await supabase
		.from("courses")
		.update({
			is_published: isPublished,
			published_at: isPublished ? new Date().toISOString() : null,
		})
		.eq("id", courseId)
		.select("slug")
		.single();

	if (error) return { success: false, error: error.message };

	const courseSlug = updatedCourse.slug ?? courseId;
	revalidatePath(routes.d.instructor.courses.slug.page({ slug: courseSlug }));
	revalidatePath(routes.courses.slug.page({ slug: courseSlug }));
	revalidatePath(`/d/instructor/courses/new/${courseId}`);
	revalidatePath("/d/instructor/courses");

	return { success: true, data: undefined };
}
