import type { Database } from "@/lib/supabase/database.types";

export type OmrScanStatus = Database["public"]["Enums"]["omr_scan_status"];
export type QuizRegistrationSource =
	Database["public"]["Enums"]["quiz_registration_source"];

export interface QuizOmrSummary {
	id: string;
	title: string;
	question_count: number;
	locked_at: string | null;
	print_version: number;
	registration_deadline: string | null;
	school_id: string | null;
	user_id: string | null;
}

export interface RegistrationItem {
	id: string;
	student_id: string;
	source: QuizRegistrationSource;
	created_at: string;
	student_full_name: string | null;
	student_email: string | null;
	has_current_variant: boolean;
}

export interface VariantItem {
	id: string;
	student_id: string;
	student_full_name: string | null;
	shuffled: boolean;
	template_version: number;
	question_count: number;
	created_at: string;
	latest_scan_status: OmrScanStatus | null;
}

export interface ScanItem {
	id: string;
	variant_id: string;
	student_full_name: string | null;
	image_storage_path: string;
	status: OmrScanStatus;
	error_message: string | null;
	total_questions: number | null;
	total_correct: number | null;
	score_pct: number | null;
	uploaded_at: string;
	scored_at: string | null;
}

export interface ScanResponseItem {
	id: string;
	question_id: string;
	detected_option_index: number | null;
	confidence: number | null;
	is_correct: boolean | null;
}

export interface PerQuestionStat {
	question_id: string;
	position: number;
	total_answered: number;
	total_wrong: number;
	wrong_pct: number;
}

export interface ResultsSummary {
	rows: ScanItem[];
	average_score_pct: number | null;
	scored_count: number;
	per_question: PerQuestionStat[];
}
