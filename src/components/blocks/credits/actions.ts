"use server";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Result<T> = { success: true; data: T } | { success: false; error: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type CreditTransactionItem = Tables<"credit_transactions">;

export type PurchaseItem = Tables<"purchases"> & {
	itemTitle: string | null;
};

export type SellerEarnings = {
	totalCredits: number;
	sales: PurchaseItem[];
};

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

// ─── Admin: charge a student's account ─────────────────────────────────────

export async function chargeStudentCredits(
	userId: string,
	amount: number,
	note?: string
): Promise<Result<{ balanceAfter: number }>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("admin_topup_credits", {
		p_user_id: userId,
		p_amount: amount,
		p_note: note?.trim() || undefined,
	});
	if (error) return { success: false, error: error.message };

	return { success: true, data: { balanceAfter: data.balance_after } };
}

// ─── Ledger (credit_transactions) ───────────────────────────────────────────

export async function getCreditLedger(
	profileId?: string
): Promise<Result<CreditTransactionItem[]>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("credit_transactions")
		.select("*")
		.eq("profile_id", profileId ?? user.id)
		.order("created_at", { ascending: false });

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── Item title lookup — purchases.item_id is polymorphic (course/deck/quiz),
// so titles must be batch-fetched per item_type rather than joined.
// ─────────────────────────────────────────────────────────────────────────

async function attachItemTitles(
	supabase: SupabaseServerClient,
	purchases: Tables<"purchases">[]
): Promise<PurchaseItem[]> {
	const idsByType = {
		course: [] as string[],
		deck: [] as string[],
		quiz: [] as string[],
	};
	for (const p of purchases) idsByType[p.item_type].push(p.item_id);

	const [courses, decks, quizzes] = await Promise.all([
		idsByType.course.length
			? supabase.from("courses").select("id, title").in("id", idsByType.course)
			: Promise.resolve({ data: [] }),
		idsByType.deck.length
			? supabase.from("decks").select("id, name").in("id", idsByType.deck)
			: Promise.resolve({ data: [] }),
		idsByType.quiz.length
			? supabase.from("quizzes").select("id, title").in("id", idsByType.quiz)
			: Promise.resolve({ data: [] }),
	]);

	const titleMap = new Map<string, string>();
	for (const c of courses.data ?? []) titleMap.set(`course:${c.id}`, c.title);
	for (const d of decks.data ?? []) titleMap.set(`deck:${d.id}`, d.name);
	for (const q of quizzes.data ?? []) titleMap.set(`quiz:${q.id}`, q.title);

	return purchases.map((p) => ({
		...p,
		itemTitle: titleMap.get(`${p.item_type}:${p.item_id}`) ?? null,
	}));
}

// ─── Purchase history (buyer side) ──────────────────────────────────────────

export async function getPurchaseHistory(
	profileId?: string
): Promise<Result<PurchaseItem[]>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("purchases")
		.select("*")
		.eq("buyer_id", profileId ?? user.id)
		.order("created_at", { ascending: false });

	if (error) return { success: false, error: error.message };
	return { success: true, data: await attachItemTitles(supabase, data ?? []) };
}

// ─── Seller earnings (instructor / school / student-selling-decks) ─────────

export async function getSellerEarnings(
	seller: { profileId: string } | { schoolId: string }
): Promise<Result<SellerEarnings>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const query =
		"profileId" in seller
			? supabase
					.from("purchases")
					.select("*")
					.eq("seller_profile_id", seller.profileId)
			: supabase
					.from("purchases")
					.select("*")
					.eq("seller_school_id", seller.schoolId);

	const { data, error } = await query.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };

	const sales = await attachItemTitles(supabase, data ?? []);
	const totalCredits = sales.reduce((sum, s) => sum + s.price_credits, 0);
	return { success: true, data: { totalCredits, sales } };
}
