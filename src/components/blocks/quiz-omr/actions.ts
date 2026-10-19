"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type {
	OmrScanStatus,
	PerQuestionStat,
	RegistrationItem,
	ResultsSummary,
	ScanItem,
	ScanResponseItem,
	VariantItem,
} from "./types";

type ActionResult<T = undefined> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Batched student display-info lookup. profiles RLS only allows selecting
 * your own row, so an instructor/school owner can't join full_name/email for
 * *other* users via the normal RLS-respecting client. All list functions
 * below do their main query with the RLS-respecting client (so ownership of
 * the quiz/variant/scan is still enforced for real), then enrich just the
 * display fields with this service-role lookup.
 */
async function getStudentDisplayMap(
	studentIds: string[]
): Promise<Record<string, { full_name: string | null; email: string | null }>> {
	const uniqueIds = [...new Set(studentIds)];
	if (uniqueIds.length === 0) return {};

	const admin = createServiceRoleClient();
	const { data } = await admin
		.from("profiles")
		.select("id, full_name, email")
		.in("id", uniqueIds);

	const map: Record<
		string,
		{ full_name: string | null; email: string | null }
	> = {};
	for (const row of data ?? []) {
		map[row.id] = { full_name: row.full_name, email: row.email };
	}
	return map;
}

// ─── Roster ─────────────────────────────────────────────────────────────────

export async function listRegistrations(
	quizId: string
): Promise<ActionResult<RegistrationItem[]>> {
	const supabase = await createClient();

	const { data: quiz } = await supabase
		.from("quizzes")
		.select("print_version")
		.eq("id", quizId)
		.single();

	const { data: registrations, error } = await supabase
		.from("quiz_registrations")
		.select("id, student_id, source, created_at")
		.eq("quiz_id", quizId)
		.order("created_at", { ascending: true });
	if (error) return { success: false, error: error.message };

	const { data: variants } = await supabase
		.from("quiz_variants")
		.select("student_id")
		.eq("quiz_id", quizId)
		.eq("template_version", quiz?.print_version ?? -1);
	const studentsWithVariant = new Set(
		(variants ?? []).map((v) => v.student_id)
	);

	const displayMap = await getStudentDisplayMap(
		(registrations ?? []).map((r) => r.student_id)
	);

	const items: RegistrationItem[] = (registrations ?? []).map((r) => ({
		id: r.id,
		student_id: r.student_id,
		source: r.source,
		created_at: r.created_at,
		student_full_name: displayMap[r.student_id]?.full_name ?? null,
		student_email: displayMap[r.student_id]?.email ?? null,
		has_current_variant: studentsWithVariant.has(r.student_id),
	}));

	return { success: true, data: items };
}

export interface StudentLookupResult {
	id: string;
	full_name: string | null;
	email: string | null;
}

/**
 * Profiles are only self-readable under RLS (no general "search other users"
 * policy exists), so a plain client-side query can never find another
 * student's profile by email. This uses the service-role client for the
 * lookup only, strictly scoped to role = 'student' and a handful of public
 * display fields — the actual registration write below still goes through
 * the normal RLS-respecting client, so ownership is enforced for real there.
 */
export async function findStudentByEmail(
	email: string
): Promise<ActionResult<StudentLookupResult | null>> {
	if (!email.trim()) return { success: true, data: null };

	const admin = createServiceRoleClient();
	const { data, error } = await admin
		.from("profiles")
		.select("id, full_name, email")
		.eq("email", email.trim())
		.eq("role", "student")
		.maybeSingle();

	if (error) return { success: false, error: error.message };
	return { success: true, data: data ?? null };
}

export async function addRegistration(
	quizId: string,
	studentId: string
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Not authenticated" };

	const { error } = await supabase.from("quiz_registrations").insert({
		quiz_id: quizId,
		student_id: studentId,
		source: "owner",
		registered_by: user.id,
	});

	if (error) return { success: false, error: error.message };
	revalidatePath("/d");
	return { success: true, data: undefined };
}

export async function removeRegistration(
	registrationId: string
): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase
		.from("quiz_registrations")
		.delete()
		.eq("id", registrationId);

	if (error) return { success: false, error: error.message };
	revalidatePath("/d");
	return { success: true, data: undefined };
}

// ─── Print / variants / lock ───────────────────────────────────────────────

export async function listVariants(
	quizId: string
): Promise<ActionResult<VariantItem[]>> {
	const supabase = await createClient();

	const { data: quiz } = await supabase
		.from("quizzes")
		.select("print_version")
		.eq("id", quizId)
		.single();

	const { data: variants, error } = await supabase
		.from("quiz_variants")
		.select(
			"id, student_id, shuffled, template_version, question_order, created_at"
		)
		.eq("quiz_id", quizId)
		.eq("template_version", quiz?.print_version ?? -1)
		.order("created_at", { ascending: true });
	if (error) return { success: false, error: error.message };

	const variantIds = (variants ?? []).map((v) => v.id);
	const { data: scans } = await supabase
		.from("omr_scans")
		.select("variant_id, status, uploaded_at")
		.in("variant_id", variantIds.length > 0 ? variantIds : ["__none__"])
		.order("uploaded_at", { ascending: false });

	const latestStatusByVariant: Record<string, OmrScanStatus> = {};
	for (const scan of scans ?? []) {
		if (!latestStatusByVariant[scan.variant_id]) {
			latestStatusByVariant[scan.variant_id] = scan.status;
		}
	}

	const displayMap = await getStudentDisplayMap(
		(variants ?? []).map((v) => v.student_id)
	);

	const items: VariantItem[] = (variants ?? []).map((v) => ({
		id: v.id,
		student_id: v.student_id,
		student_full_name: displayMap[v.student_id]?.full_name ?? null,
		shuffled: v.shuffled,
		template_version: v.template_version,
		question_count: (v.question_order as string[])?.length ?? 0,
		created_at: v.created_at,
		latest_scan_status: latestStatusByVariant[v.id] ?? null,
	}));

	return { success: true, data: items };
}

export async function printVariants(
	quizId: string,
	shuffle: boolean
): Promise<ActionResult<{ variantCount: number }>> {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("generate_quiz_variants", {
		p_quiz_id: quizId,
		p_shuffle: shuffle,
	});

	if (error) return { success: false, error: error.message };
	revalidatePath("/d");
	return { success: true, data: { variantCount: data?.length ?? 0 } };
}

export async function unlockQuiz(quizId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("unlock_quiz_for_editing", {
		p_quiz_id: quizId,
	});

	if (error) return { success: false, error: error.message };
	revalidatePath("/d");
	return { success: true, data: undefined };
}

// ─── Manual correction of a low-confidence response ────────────────────────

export async function correctScanResponse(
	responseId: string,
	detectedOptionIndex: number
): Promise<ActionResult> {
	const supabase = await createClient();

	const { data: response, error: responseError } = await supabase
		.from("omr_scan_responses")
		.select("id, scan_id, question_id")
		.eq("id", responseId)
		.single();
	if (responseError || !response)
		return { success: false, error: responseError?.message ?? "Not found" };

	const { data: correctOption } = await supabase
		.from("question_options")
		.select("id")
		.eq("question_id", response.question_id)
		.eq("order_index", detectedOptionIndex)
		.eq("is_correct", true)
		.maybeSingle();

	const { error: updateError } = await supabase
		.from("omr_scan_responses")
		.update({
			detected_option_index: detectedOptionIndex,
			confidence: 1,
			is_correct: !!correctOption,
		})
		.eq("id", responseId);
	if (updateError) return { success: false, error: updateError.message };

	// Recompute the parent scan's aggregate score + status from all its responses.
	const { data: allResponses, error: allError } = await supabase
		.from("omr_scan_responses")
		.select("is_correct, confidence")
		.eq("scan_id", response.scan_id);
	if (allError) return { success: false, error: allError.message };

	const totalQuestions = allResponses?.length ?? 0;
	const totalCorrect = allResponses?.filter((r) => r.is_correct).length ?? 0;
	const stillNeedsReview =
		allResponses?.some((r) => (r.confidence ?? 0) < 0.75) ?? false;

	const { error: scanUpdateError } = await supabase
		.from("omr_scans")
		.update({
			total_questions: totalQuestions,
			total_correct: totalCorrect,
			score_pct:
				totalQuestions > 0
					? Math.round((totalCorrect / totalQuestions) * 10000) / 100
					: null,
			status: stillNeedsReview ? "needs_review" : "scored",
		})
		.eq("id", response.scan_id);
	if (scanUpdateError)
		return { success: false, error: scanUpdateError.message };

	revalidatePath("/d");
	return { success: true, data: undefined };
}

// ─── Scans + results ────────────────────────────────────────────────────────

export async function listScans(
	quizId: string
): Promise<ActionResult<ScanItem[]>> {
	const supabase = await createClient();

	const { data: variants, error: variantsError } = await supabase
		.from("quiz_variants")
		.select("id, student_id")
		.eq("quiz_id", quizId);
	if (variantsError) return { success: false, error: variantsError.message };

	const variantIds = (variants ?? []).map((v) => v.id);
	const { data: scans, error } = await supabase
		.from("omr_scans")
		.select(
			"id, variant_id, image_storage_path, status, error_message, total_questions, total_correct, score_pct, uploaded_at, scored_at"
		)
		.in("variant_id", variantIds.length > 0 ? variantIds : ["__none__"])
		.order("uploaded_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	const studentByVariant = new Map(
		(variants ?? []).map((v) => [v.id, v.student_id])
	);
	const displayMap = await getStudentDisplayMap(
		[...studentByVariant.values()].filter((id): id is string => !!id)
	);

	const items: ScanItem[] = (scans ?? []).map((s) => {
		const studentId = studentByVariant.get(s.variant_id);
		return {
			id: s.id,
			variant_id: s.variant_id,
			student_full_name: studentId
				? (displayMap[studentId]?.full_name ?? null)
				: null,
			image_storage_path: s.image_storage_path,
			status: s.status,
			error_message: s.error_message,
			total_questions: s.total_questions,
			total_correct: s.total_correct,
			score_pct: s.score_pct,
			uploaded_at: s.uploaded_at,
			scored_at: s.scored_at,
		};
	});

	return { success: true, data: items };
}

export async function listScanResponses(
	scanId: string
): Promise<ActionResult<ScanResponseItem[]>> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("omr_scan_responses")
		.select("id, question_id, detected_option_index, confidence, is_correct")
		.eq("scan_id", scanId);
	if (error) return { success: false, error: error.message };
	return { success: true, data: data ?? [] };
}

export async function getScanImageUrl(
	scanId: string
): Promise<ActionResult<string>> {
	const supabase = await createClient();

	const { data: scan, error: scanError } = await supabase
		.from("omr_scans")
		.select("image_storage_path")
		.eq("id", scanId)
		.single();
	if (scanError || !scan)
		return { success: false, error: scanError?.message ?? "Scan not found" };

	const { data, error } = await supabase.storage
		.from("omr-scans")
		.createSignedUrl(scan.image_storage_path, 60 * 10);
	if (error || !data)
		return { success: false, error: error?.message ?? "Failed" };
	return { success: true, data: data.signedUrl };
}

export async function listResults(
	quizId: string
): Promise<ActionResult<ResultsSummary>> {
	const scansResult = await listScans(quizId);
	if (!scansResult.success) return scansResult;
	const rows = scansResult.data;

	const scoredRows = rows.filter((r) => r.score_pct != null);
	const averageScorePct =
		scoredRows.length > 0
			? Math.round(
					(scoredRows.reduce((s, r) => s + (r.score_pct ?? 0), 0) /
						scoredRows.length) *
						100
				) / 100
			: null;

	const supabase = await createClient();
	const { data: questions } = await supabase
		.from("questions")
		.select("id, order_index")
		.eq("quiz_id", quizId)
		.order("order_index");

	const scanIds = rows.map((r) => r.id);
	const { data: allResponses } = await supabase
		.from("omr_scan_responses")
		.select("question_id, is_correct")
		.in("scan_id", scanIds.length > 0 ? scanIds : ["__none__"]);

	const perQuestion: PerQuestionStat[] = (questions ?? []).map((q, idx) => {
		const responsesForQuestion = (allResponses ?? []).filter(
			(r) => r.question_id === q.id
		);
		const totalAnswered = responsesForQuestion.length;
		const totalWrong = responsesForQuestion.filter((r) => !r.is_correct).length;
		return {
			question_id: q.id,
			position: idx + 1,
			total_answered: totalAnswered,
			total_wrong: totalWrong,
			wrong_pct:
				totalAnswered > 0 ? Math.round((totalWrong / totalAnswered) * 100) : 0,
		};
	});

	return {
		success: true,
		data: {
			rows,
			average_score_pct: averageScorePct,
			scored_count: scoredRows.length,
			per_question: perQuestion,
		},
	};
}
