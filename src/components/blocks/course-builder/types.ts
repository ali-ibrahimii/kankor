import type { Database, Enums } from "@/lib/supabase/database.types";

export type LessonContentType =
	Database["public"]["Enums"]["lesson_content_type"];
export type CourseLevel = Database["public"]["Enums"]["course_level"];
export type LanguageEnum = Database["public"]["Enums"]["language_enum"];

// ─── Draft types (live in Jotai, never stored directly) ───────────────────────

export interface DraftModule {
	id: string;
	course_id: string;
	title: string;
	description: string | null;
	order_index: number;
	start_page: number | null;
	end_page: number | null;
	_isNew?: boolean;
	_deleted?: boolean;
}

export interface DraftLesson {
	id: string;
	module_id: string | null;
	course_id: string | null;
	title: string;
	description: string | null;
	content_type: LessonContentType;
	order_index: number;
	is_previewable: boolean;
	is_mandatory: boolean;
	estimated_duration_minutes: number | null;
	slug: string | null;
	_isNew?: boolean;
	_deleted?: boolean;
}

export interface DraftContentBlock {
	id: string;
	lesson_id: string | null;
	course_id: string | null;
	block_type: LessonContentType;
	order_index: number;
	// Text
	text_content: string | null;
	// Video
	video_url: string | null;
	video_provider: string | null;
	video_transcript: string | null;
	/** R2 object key for a self-hosted upload. Takes priority over video_url when set. */
	video_storage_key: string | null;
	// Audio
	audio_url: string | null;
	audio_transcript: string | null;
	/** R2 object key for a self-hosted upload. Takes priority over audio_url when set. */
	audio_storage_key: string | null;
	// Document / Slide
	document_url: string | null;
	/** R2 object key for a self-hosted upload. Takes priority over document_url when set. */
	document_storage_key: string | null;
	// Image
	image_url: string | null;
	// Code playground
	code_language: string | null;
	default_code: string | null;
	solution_code: string | null;
	// External resource
	external_resource_url: string | null;
	external_resource_title: string | null;
	// Playlist
	playlist: string | null;
	// Slug
	slug: string | null;
	_isNew?: boolean;
	_deleted?: boolean;
}

// ─── Builder UI state ─────────────────────────────────────────────────────────

export interface CourseBuilderState {
	courseId: string;
	activeLessonId: string | null;
	activeBlockId: string | null;
	modules: DraftModule[];
	lessons: DraftLesson[];
	blocks: DraftContentBlock[];
	isSaving: boolean;
	isPublishing: boolean;
	expandedModuleIds: Set<string>;
}

// ─── New course form ──────────────────────────────────────────────────────────

export interface NewCourseFormValues {
	title: string;
	subtitle: string;
	description: string;
	language: string;
	level: string;
	is_free: boolean;
	price_credits: string;
	visibility: Enums<"visibility">;
	related_decks_ids: string[];
	related_quizzes_ids: string[];
	related_libraries_ids: string[];
	book_id?: string | null;
	subject_id?: string | null;
	grade_id?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function createEmptyModule(
	courseId: string,
	index: number
): DraftModule {
	return {
		id: crypto.randomUUID(),
		course_id: courseId,
		title: "",
		description: null,
		order_index: index,
		start_page: null,
		end_page: null,
		_isNew: true,
	};
}

export function createEmptyLesson(
	moduleId: string,
	courseId: string,
	index: number,
	type: LessonContentType = "video"
): DraftLesson {
	return {
		id: crypto.randomUUID(),
		module_id: moduleId,
		course_id: courseId,
		title: "",
		description: null,
		content_type: type,
		order_index: index,
		is_previewable: false,
		is_mandatory: true,
		estimated_duration_minutes: null,
		slug: null,
		_isNew: true,
	};
}

export function createEmptyBlock(
	lessonId: string,
	courseId: string,
	blockType: LessonContentType,
	index: number
): DraftContentBlock {
	return {
		id: crypto.randomUUID(),
		lesson_id: lessonId,
		course_id: courseId,
		block_type: blockType,
		order_index: index,
		text_content: null,
		video_url: null,
		video_provider: null,
		video_transcript: null,
		video_storage_key: null,
		audio_url: null,
		audio_transcript: null,
		audio_storage_key: null,
		document_url: null,
		document_storage_key: null,
		image_url: null,
		code_language: null,
		default_code: null,
		solution_code: null,
		external_resource_url: null,
		external_resource_title: null,
		playlist: null,
		slug: null,
		_isNew: true,
	};
}

export const CONTENT_TYPE_ICONS: Record<LessonContentType, string> = {
	video: "Play",
	text: "FileText",
	audio: "Volume2",
	pdf_document: "FileText",
	slide_presentation: "PresentationIcon",
	quiz: "ClipboardList",
	assignment: "PenLine",
	external_resource: "Link",
	code_playground: "Code2",
};

export const ADDABLE_BLOCK_TYPES: LessonContentType[] = [
	"text",
	"video",
	"audio",
	"pdf_document",
	"slide_presentation",
	"external_resource",
	"code_playground",
];
