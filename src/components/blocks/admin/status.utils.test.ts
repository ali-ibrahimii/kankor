import { describe, expect, it } from "vitest";
import {
	type AccountStatus,
	getStatusActions,
	isDestructiveAction,
	STATUS_ACTION_TARGET,
	type StatusAction,
	statusBadgeVariant,
} from "./status.utils";

describe("getStatusActions", () => {
	it("offers verify/reject for pending accounts", () => {
		expect(getStatusActions("pending")).toEqual(["verify", "reject"]);
	});

	it("treats null status as pending (profiles.instructor_status default)", () => {
		expect(getStatusActions(null)).toEqual(getStatusActions("pending"));
	});

	it("offers suspend/disable for active accounts", () => {
		expect(getStatusActions("active")).toEqual(["suspend", "disable"]);
	});

	it("allows re-activating suspended and disabled accounts", () => {
		expect(getStatusActions("suspended")).toContain("activate");
		expect(getStatusActions("disabled")).toContain("activate");
	});

	it("allows verifying a previously rejected account", () => {
		expect(getStatusActions("rejected")).toEqual(["verify"]);
	});

	it("never offers a transition to the current status", () => {
		const statuses: AccountStatus[] = [
			"pending",
			"active",
			"rejected",
			"suspended",
			"disabled",
		];
		for (const status of statuses) {
			for (const action of getStatusActions(status)) {
				expect(STATUS_ACTION_TARGET[action]).not.toBe(status);
			}
		}
	});
});

describe("STATUS_ACTION_TARGET", () => {
	it("maps every action to a valid account status", () => {
		const validStatuses: AccountStatus[] = [
			"pending",
			"active",
			"rejected",
			"suspended",
			"disabled",
		];
		for (const target of Object.values(STATUS_ACTION_TARGET)) {
			expect(validStatuses).toContain(target);
		}
	});

	it("verify and activate both result in an active account", () => {
		expect(STATUS_ACTION_TARGET.verify).toBe("active");
		expect(STATUS_ACTION_TARGET.activate).toBe("active");
	});
});

describe("statusBadgeVariant", () => {
	it("renders active as the primary badge", () => {
		expect(statusBadgeVariant("active")).toBe("default");
	});

	it("renders rejected and disabled as destructive", () => {
		expect(statusBadgeVariant("rejected")).toBe("destructive");
		expect(statusBadgeVariant("disabled")).toBe("destructive");
	});

	it("falls back to the pending variant for null", () => {
		expect(statusBadgeVariant(null)).toBe(statusBadgeVariant("pending"));
	});
});

describe("isDestructiveAction", () => {
	it("flags suspend/disable/reject as destructive", () => {
		const destructive: StatusAction[] = ["suspend", "disable", "reject"];
		for (const action of destructive) {
			expect(isDestructiveAction(action)).toBe(true);
		}
	});

	it("does not flag verify/activate", () => {
		expect(isDestructiveAction("verify")).toBe(false);
		expect(isDestructiveAction("activate")).toBe(false);
	});
});
