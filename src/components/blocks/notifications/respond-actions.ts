"use server";

import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "./types";

type Result<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

const CLASSROOM_REQUEST_TYPES: NotificationType[] = [
	"classroom_invite",
	"classroom_join_request",
];

/**
 * classroom_invite (instructor invited a student) and classroom_join_request
 * (student asked to join by code) both resolve through the same RPC — it
 * figures out which direction it is from the request row's `initiated_by`
 * and checks that the caller is the correct responder either way.
 */
export async function respondToInviteNotification(
	notificationType: NotificationType,
	relatedEntityId: string,
	approve: boolean
): Promise<Result> {
	const supabase = await createClient();

	if (CLASSROOM_REQUEST_TYPES.includes(notificationType)) {
		const { error } = await supabase.rpc("respond_to_classroom_request", {
			p_request_id: relatedEntityId,
			p_approve: approve,
		});
		if (error) return { success: false, error: error.message };
		return { success: true, data: undefined };
	}

	if (notificationType === "school_invite") {
		const { error } = await supabase.rpc("respond_to_school_invite", {
			p_invite_id: relatedEntityId,
			p_accept: approve,
		});
		if (error) return { success: false, error: error.message };
		return { success: true, data: undefined };
	}

	return {
		success: false,
		error: "This notification doesn't support a response.",
	};
}
