import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		rpc: mockRpc,
		from: mockFrom,
	}),
}));

import {
	addAgencyMember,
	chargeStudent,
	createAgency,
	recordAgencySettlement,
	resolveAgencyDispute,
} from "@/components/blocks/agencies/actions";

const AGENCY_ID = "00000000-0000-0000-0000-000000000001";

function authedAs(userId: string | null) {
	mockGetUser.mockResolvedValue({
		data: { user: userId ? { id: userId } : null },
	});
}

beforeEach(() => {
	mockGetUser.mockReset();
	mockRpc.mockReset();
	mockFrom.mockReset();
});

describe("chargeStudent", () => {
	it("fails when unauthenticated without calling the RPC", async () => {
		authedAs(null);

		const result = await chargeStudent({
			agencyId: AGENCY_ID,
			studentEmail: "student@example.com",
			amount: 500,
		});

		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockRpc).not.toHaveBeenCalled();
	});

	it("calls agency_charge_student with the right arguments", async () => {
		authedAs("user-1");
		const receipt = {
			topup_id: "t-1",
			amount: 500,
			student_name: "Zahra",
			student_email_masked: "za***@example.com",
			balance_after: 500,
			created_at: "2026-07-13T00:00:00Z",
		};
		mockRpc.mockResolvedValue({ data: receipt, error: null });

		const result = await chargeStudent({
			agencyId: AGENCY_ID,
			studentEmail: "zahra@example.com",
			amount: 500,
			note: "cash",
		});

		expect(mockRpc).toHaveBeenCalledWith("agency_charge_student", {
			p_agency_id: AGENCY_ID,
			p_student_email: "zahra@example.com",
			p_amount: 500,
			p_note: "cash",
		});
		expect(result).toEqual({ success: true, data: receipt });
	});

	it("surfaces machine-readable RPC errors", async () => {
		authedAs("user-1");
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "liability_limit_exceeded" },
		});

		const result = await chargeStudent({
			agencyId: AGENCY_ID,
			studentEmail: "zahra@example.com",
			amount: 999_999,
		});

		expect(result).toEqual({
			success: false,
			error: "liability_limit_exceeded",
		});
	});
});

describe("recordAgencySettlement", () => {
	it("passes gross amount and method to the RPC", async () => {
		authedAs("admin-1");
		mockRpc.mockResolvedValue({ data: { id: "s-1" }, error: null });

		await recordAgencySettlement({
			agencyId: AGENCY_ID,
			grossAmount: 10_000,
			method: "hawala",
			note: "weekly",
		});

		expect(mockRpc).toHaveBeenCalledWith("record_agency_settlement", {
			p_agency_id: AGENCY_ID,
			p_gross_amount: 10_000,
			p_method: "hawala",
			p_period_start: undefined,
			p_period_end: undefined,
			p_note: "weekly",
		});
	});
});

describe("addAgencyMember", () => {
	it("routes through the definer RPC (no direct profile lookup)", async () => {
		authedAs("owner-1");
		mockRpc.mockResolvedValue({ data: { id: "m-1" }, error: null });

		await addAgencyMember(AGENCY_ID, "clerk@example.com", "staff");

		expect(mockRpc).toHaveBeenCalledWith("add_agency_member", {
			p_agency_id: AGENCY_ID,
			p_email: "clerk@example.com",
			p_role: "staff",
		});
		expect(mockFrom).not.toHaveBeenCalledWith("profiles");
	});
});

describe("resolveAgencyDispute", () => {
	it("forwards the optional credit adjustment", async () => {
		authedAs("admin-1");
		mockRpc.mockResolvedValue({ data: { id: "d-1" }, error: null });

		await resolveAgencyDispute({
			disputeId: "d-1",
			status: "resolved",
			resolutionNote: "agency shorted the student",
			adjustmentAmount: 200,
		});

		expect(mockRpc).toHaveBeenCalledWith("resolve_agency_dispute", {
			p_dispute_id: "d-1",
			p_status: "resolved",
			p_resolution_note: "agency shorted the student",
			p_adjustment_amount: 200,
		});
	});
});

describe("createAgency", () => {
	it("stamps created_by with the current user", async () => {
		authedAs("admin-1");
		const single = vi.fn().mockResolvedValue({
			data: { id: AGENCY_ID },
			error: null,
		});
		const select = vi.fn().mockReturnValue({ single });
		const insert = vi.fn().mockReturnValue({ select });
		mockFrom.mockReturnValue({ insert });

		const values = {
			name: "Kabul Agency",
			province_id: null,
			contact_email: null,
			contact_phone: null,
			address: null,
			commission_rate: 0.05,
			liability_limit: 100_000,
		};
		const result = await createAgency(values);

		expect(mockFrom).toHaveBeenCalledWith("agencies");
		expect(insert).toHaveBeenCalledWith({ ...values, created_by: "admin-1" });
		expect(result.success).toBe(true);
	});
});
