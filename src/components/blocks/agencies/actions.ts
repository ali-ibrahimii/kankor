"use server";

import type { Database, Json, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Result<T = null> =
	| { success: true; data: T }
	| { success: false; error: string };

type AgencyStatus = Database["public"]["Enums"]["agency_status"];
type AgencyMemberRole = Database["public"]["Enums"]["agency_member_role"];
type AgencyMemberStatus = Database["public"]["Enums"]["agency_member_status"];
type AgencyPermission = Database["public"]["Enums"]["agency_permission"];
type AgencyGrantScope = Database["public"]["Enums"]["agency_grant_scope"];
type AgencySettlementMethod =
	Database["public"]["Enums"]["agency_settlement_method"];
type AgencyDisputeStatus = Database["public"]["Enums"]["agency_dispute_status"];

export type AgencyChargeReceipt = {
	topup_id: string;
	amount: number;
	student_name: string | null;
	student_email_masked: string;
	balance_after: number;
	created_at: string;
};

export type AgencyOverview = {
	charged_total: number;
	topup_count: number;
	students_charged: number;
	charged_last_30d: number;
	settled_gross: number;
	commission_earned: number;
	outstanding: number;
	liability_limit: number;
	open_disputes: number;
	sales_count: number;
	sales_total: number;
};

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

// ─── Agency management (super admin; RLS-gated) ─────────────────────────────

export type AgencyUpsertValues = {
	name: string;
	province_id: string | null;
	contact_email: string | null;
	contact_phone: string | null;
	address: string | null;
	commission_rate: number;
	liability_limit: number;
};

export async function createAgency(
	values: AgencyUpsertValues
): Promise<Result<Tables<"agencies">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("agencies")
		.insert({ ...values, created_by: user.id })
		.select()
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function updateAgency(
	agencyId: string,
	values: Partial<AgencyUpsertValues>
): Promise<Result<Tables<"agencies">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("agencies")
		.update(values)
		.eq("id", agencyId)
		.select()
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function setAgencyStatus(
	agencyId: string,
	status: AgencyStatus
): Promise<Result<Pick<Tables<"agencies">, "id" | "status">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("agencies")
		.update({ status })
		.eq("id", agencyId)
		.select("id, status")
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── Grants (super admin; RLS-gated) ─────────────────────────────────────────

export async function upsertAgencyGrant(input: {
	agency_id: string;
	permission: AgencyPermission;
	scope_type: AgencyGrantScope;
	scope: Json | null;
}): Promise<Result<Tables<"agency_grants">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase
		.from("agency_grants")
		.upsert(
			{ ...input, granted_by: user.id },
			{ onConflict: "agency_id,permission" }
		)
		.select()
		.single();

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function removeAgencyGrant(
	agencyId: string,
	permission: AgencyPermission
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("agency_grants")
		.delete()
		.eq("agency_id", agencyId)
		.eq("permission", permission);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

// ─── Members ─────────────────────────────────────────────────────────────────
// add goes through the definer RPC (email→user lookup without profile access);
// role/status updates are RLS-gated table writes.

export async function addAgencyMember(
	agencyId: string,
	email: string,
	role: AgencyMemberRole
): Promise<Result<Tables<"agency_members">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("add_agency_member", {
		p_agency_id: agencyId,
		p_email: email,
		p_role: role,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function setAgencyMemberRole(
	memberId: string,
	role: AgencyMemberRole
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("agency_members")
		.update({ role })
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

export async function setAgencyMemberStatus(
	memberId: string,
	status: AgencyMemberStatus
): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("agency_members")
		.update({ status })
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

export async function removeAgencyMember(memberId: string): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase
		.from("agency_members")
		.delete()
		.eq("id", memberId);

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

// ─── Money flow (definer RPCs) ───────────────────────────────────────────────

export async function chargeStudent(input: {
	agencyId: string;
	studentEmail: string;
	amount: number;
	note?: string;
}): Promise<Result<AgencyChargeReceipt>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("agency_charge_student", {
		p_agency_id: input.agencyId,
		p_student_email: input.studentEmail,
		p_amount: input.amount,
		p_note: input.note,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data: data as AgencyChargeReceipt };
}

export async function recordAgencySettlement(input: {
	agencyId: string;
	grossAmount: number;
	method: AgencySettlementMethod;
	periodStart?: string;
	periodEnd?: string;
	note?: string;
}): Promise<Result<Tables<"agency_settlements">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("record_agency_settlement", {
		p_agency_id: input.agencyId,
		p_gross_amount: input.grossAmount,
		p_method: input.method,
		p_period_start: input.periodStart,
		p_period_end: input.periodEnd,
		p_note: input.note,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function getAgencyOverview(
	agencyId: string
): Promise<Result<AgencyOverview>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("get_agency_overview", {
		p_agency_id: agencyId,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data: data as AgencyOverview };
}

// ─── Moderation (Phase 2 definer RPCs) ───────────────────────────────────────

export type ModerationAction = "suspend" | "reactivate";

export async function agencySetSchoolStatus(input: {
	agencyId: string;
	schoolId: string;
	action: ModerationAction;
	reason?: string;
}): Promise<Result<Tables<"schools">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("agency_set_school_status", {
		p_agency_id: input.agencyId,
		p_school_id: input.schoolId,
		p_action: input.action,
		p_reason: input.reason,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function agencySetInstructorStatus(input: {
	agencyId: string;
	instructorId: string;
	action: ModerationAction;
	reason?: string;
}): Promise<Result> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { error } = await supabase.rpc("agency_set_instructor_status", {
		p_agency_id: input.agencyId,
		p_instructor_id: input.instructorId,
		p_action: input.action,
		p_reason: input.reason,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data: null };
}

export async function agencyUpdateSchool(input: {
	agencyId: string;
	schoolId: string;
	name?: string;
	address?: string;
	adminEmail?: string;
}): Promise<Result<Tables<"schools">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("agency_update_school", {
		p_agency_id: input.agencyId,
		p_school_id: input.schoolId,
		p_name: input.name,
		p_address: input.address,
		p_admin_email: input.adminEmail,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

// ─── Disputes (definer RPCs) ─────────────────────────────────────────────────

export async function openTopupDispute(
	topupId: string,
	note: string
): Promise<Result<Tables<"agency_disputes">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("open_agency_topup_dispute", {
		p_topup_id: topupId,
		p_note: note,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function respondAgencyDispute(
	disputeId: string,
	response: string
): Promise<Result<Tables<"agency_disputes">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("respond_agency_dispute", {
		p_dispute_id: disputeId,
		p_response: response,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}

export async function resolveAgencyDispute(input: {
	disputeId: string;
	status: Extract<AgencyDisputeStatus, "resolved" | "rejected">;
	resolutionNote?: string;
	adjustmentAmount?: number;
}): Promise<Result<Tables<"agency_disputes">>> {
	const { supabase, user } = await requireUser();
	if (!user) return { success: false, error: "Unauthenticated" };

	const { data, error } = await supabase.rpc("resolve_agency_dispute", {
		p_dispute_id: input.disputeId,
		p_status: input.status,
		p_resolution_note: input.resolutionNote,
		p_adjustment_amount: input.adjustmentAmount,
	});

	if (error) return { success: false, error: error.message };
	return { success: true, data };
}
