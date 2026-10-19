import type { Database } from "@/lib/supabase/database.types";

export type AccountStatus = Database["public"]["Enums"]["account_status"];

/**
 * An admin action that transitions an account (instructor or school)
 * to a new `account_status`.
 */
export type StatusAction =
	| "verify"
	| "activate"
	| "suspend"
	| "disable"
	| "reject";

/** Target status each action transitions the account to. */
export const STATUS_ACTION_TARGET: Record<StatusAction, AccountStatus> = {
	verify: "active",
	activate: "active",
	suspend: "suspended",
	disable: "disabled",
	reject: "rejected",
};

/**
 * Status transitions available to an admin for an account in the given
 * status. A `null` status (e.g. profiles.instructor_status default) is
 * treated as "pending".
 */
export function getStatusActions(status: AccountStatus | null): StatusAction[] {
	switch (status ?? "pending") {
		case "pending":
			return ["verify", "reject"];
		case "active":
			return ["suspend", "disable"];
		case "suspended":
			return ["activate", "disable"];
		case "disabled":
			return ["activate"];
		case "rejected":
			return ["verify"];
		default:
			return [];
	}
}

/** Badge variant used to render an account status consistently. */
export function statusBadgeVariant(
	status: AccountStatus | null
): "default" | "secondary" | "destructive" | "outline" {
	switch (status ?? "pending") {
		case "active":
			return "default";
		case "pending":
			return "secondary";
		case "suspended":
			return "outline";
		case "rejected":
		case "disabled":
			return "destructive";
		default:
			return "secondary";
	}
}

/** Whether an action is destructive (rendered in red in menus). */
export function isDestructiveAction(action: StatusAction): boolean {
	return action === "reject" || action === "disable" || action === "suspend";
}
