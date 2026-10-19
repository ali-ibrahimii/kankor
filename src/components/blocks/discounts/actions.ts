"use server";

import { createClient } from "@/lib/supabase/server";
import type {
	DiscountableItem,
	DiscountFormValues,
	DiscountRow,
} from "./types";
import { parseTargetKey } from "./types";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

// ─── List ─────────────────────────────────────────────────────────────────────
// RLS already scopes `discounts` to "mine, my school's, or everything if I'm
// admin" — the explicit filters below just narrow a dashboard to exactly the
// scope that page represents (e.g. the school page shouldn't also surface an
// editor's personal discounts, even though RLS would let them see both).

export async function listDiscounts(
	owner?: { profileId: string } | { schoolId: string }
): Promise<Result<DiscountRow[]>> {
	const supabase = await createClient();

	let query = supabase.from("discounts").select("*");
	if (owner && "profileId" in owner) {
		query = query.eq("owner_profile_id", owner.profileId);
	} else if (owner && "schoolId" in owner) {
		query = query.eq("owner_school_id", owner.schoolId);
	}

	const { data, error } = await query.order("created_at", { ascending: false });
	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── Items available to discount ───────────────────────────────────────────────

export async function listDiscountableItems(
	schoolId?: string
): Promise<Result<DiscountableItem[]>> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const [coursesRes, decksRes, quizzesRes] = await Promise.all([
		schoolId
			? supabase.from("courses").select("id, title").eq("school_id", schoolId)
			: supabase
					.from("courses")
					.select("id, title")
					.eq("instructor_id", user.id),
		schoolId
			? supabase.from("decks").select("id, name").eq("school_id", schoolId)
			: supabase.from("decks").select("id, name").eq("user_id", user.id),
		schoolId
			? supabase.from("quizzes").select("id, title").eq("school_id", schoolId)
			: supabase.from("quizzes").select("id, title").eq("user_id", user.id),
	]);

	if (coursesRes.error)
		return { success: false, error: coursesRes.error.message };
	if (decksRes.error) return { success: false, error: decksRes.error.message };
	if (quizzesRes.error)
		return { success: false, error: quizzesRes.error.message };

	const items: DiscountableItem[] = [
		...(coursesRes.data ?? []).map((c) => ({
			itemType: "course" as const,
			id: c.id,
			title: c.title,
		})),
		...(decksRes.data ?? []).map((d) => ({
			itemType: "deck" as const,
			id: d.id,
			title: d.name,
		})),
		...(quizzesRes.data ?? []).map((q) => ({
			itemType: "quiz" as const,
			id: q.id,
			title: q.title,
		})),
	];

	return { success: true, data: items };
}

// ─── Create / update / delete ──────────────────────────────────────────────────

export async function createDiscount(
	values: DiscountFormValues,
	schoolId?: string
): Promise<Result<{ id: string }>> {
	const supabase = await createClient();

	const targets =
		values.scope === "all"
			? []
			: values.targetKeys.map((key) => {
					const { itemType, id } = parseTargetKey(key);
					return { item_type: itemType, item_id: id };
				});

	const { data, error } = await supabase.rpc("create_discount", {
		p_code: values.code.trim(),
		p_type: values.type,
		p_value: Number(values.value),
		p_scope: values.scope,
		p_targets: targets,
		p_school_id: schoolId ?? undefined,
		p_starts_at: values.startsAt || undefined,
		p_ends_at: values.endsAt || undefined,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data: { id: data.id } };
}

export async function updateDiscount(
	discountId: string,
	values: Pick<
		DiscountFormValues,
		"code" | "value" | "isActive" | "startsAt" | "endsAt"
	>
): Promise<Result> {
	const supabase = await createClient();

	const { error } = await supabase.rpc("update_discount", {
		p_discount_id: discountId,
		p_code: values.code.trim(),
		p_value: Number(values.value),
		p_is_active: values.isActive,
		p_starts_at: values.startsAt || undefined,
		p_ends_at: values.endsAt || undefined,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data: undefined };
}

export async function deleteDiscount(discountId: string): Promise<Result> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("delete_discount", {
		p_discount_id: discountId,
	});
	if (error) return { success: false, error: error.message };
	return { success: true, data: undefined };
}
