import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn().mockResolvedValue({
		auth: { getUser: mockGetUser },
		rpc: mockRpc,
	}),
}));

import {
	agencySetInstructorStatus,
	agencySetSchoolStatus,
	agencyUpdateSchool,
} from "@/components/blocks/agencies/actions";

const AGENCY_ID = "00000000-0000-0000-0000-000000000001";
const TARGET_ID = "00000000-0000-0000-0000-000000000002";

function authedAs(userId: string | null) {
	mockGetUser.mockResolvedValue({
		data: { user: userId ? { id: userId } : null },
	});
}

beforeEach(() => {
	mockGetUser.mockReset();
	mockRpc.mockReset();
});

describe("agencySetSchoolStatus", () => {
	it("fails when unauthenticated without calling the RPC", async () => {
		authedAs(null);

		const result = await agencySetSchoolStatus({
			agencyId: AGENCY_ID,
			schoolId: TARGET_ID,
			action: "suspend",
		});

		expect(result).toEqual({ success: false, error: "Unauthenticated" });
		expect(mockRpc).not.toHaveBeenCalled();
	});

	it("passes agency, school, action, and reason to the RPC", async () => {
		authedAs("staff-1");
		mockRpc.mockResolvedValue({
			data: { id: TARGET_ID, status: "suspended" },
			error: null,
		});

		const result = await agencySetSchoolStatus({
			agencyId: AGENCY_ID,
			schoolId: TARGET_ID,
			action: "suspend",
			reason: "fraud report",
		});

		expect(mockRpc).toHaveBeenCalledWith("agency_set_school_status", {
			p_agency_id: AGENCY_ID,
			p_school_id: TARGET_ID,
			p_action: "suspend",
			p_reason: "fraud report",
		});
		expect(result.success).toBe(true);
	});

	it("surfaces scope/permission errors from the RPC", async () => {
		authedAs("staff-1");
		mockRpc.mockResolvedValue({
			data: null,
			error: { message: "permission_denied" },
		});

		const result = await agencySetSchoolStatus({
			agencyId: AGENCY_ID,
			schoolId: TARGET_ID,
			action: "suspend",
		});

		expect(result).toEqual({ success: false, error: "permission_denied" });
	});
});

describe("agencySetInstructorStatus", () => {
	it("calls the instructor RPC for reactivation without a reason", async () => {
		authedAs("staff-1");
		mockRpc.mockResolvedValue({ data: null, error: null });

		const result = await agencySetInstructorStatus({
			agencyId: AGENCY_ID,
			instructorId: TARGET_ID,
			action: "reactivate",
		});

		expect(mockRpc).toHaveBeenCalledWith("agency_set_instructor_status", {
			p_agency_id: AGENCY_ID,
			p_instructor_id: TARGET_ID,
			p_action: "reactivate",
			p_reason: undefined,
		});
		expect(result.success).toBe(true);
	});
});

describe("agencyUpdateSchool", () => {
	it("passes only the whitelisted detail fields", async () => {
		authedAs("staff-1");
		mockRpc.mockResolvedValue({
			data: { id: TARGET_ID, name: "Renamed" },
			error: null,
		});

		await agencyUpdateSchool({
			agencyId: AGENCY_ID,
			schoolId: TARGET_ID,
			name: "Renamed",
			adminEmail: "new@school.af",
		});

		expect(mockRpc).toHaveBeenCalledWith("agency_update_school", {
			p_agency_id: AGENCY_ID,
			p_school_id: TARGET_ID,
			p_name: "Renamed",
			p_address: undefined,
			p_admin_email: "new@school.af",
		});
	});
});
