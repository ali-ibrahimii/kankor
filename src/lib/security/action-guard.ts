import { headers } from "next/headers";
import {
	AUTH_ABUSE_RULE,
	type RateLimitRule,
	rateLimit,
	rateLimitKey,
} from "./rate-limit";

/**
 * Rate-limit guard for server actions (login, signup, password reset…).
 *
 * Server actions have no `Request` object, so the client IP is read from the
 * incoming headers. If that fails (unit tests, no request scope) the limiter
 * degrades to a shared "unknown" bucket instead of throwing.
 */
export async function guardServerAction(
	action: string,
	identity: string,
	rule: RateLimitRule = AUTH_ABUSE_RULE
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
	const ip = await getClientIpFromHeaders().catch(() => "unknown");
	const result = rateLimit(rateLimitKey(action, ip, identity), rule);
	return result.ok
		? { ok: true }
		: { ok: false, retryAfterSeconds: result.retryAfterSeconds };
}

async function getClientIpFromHeaders(): Promise<string> {
	const requestHeaders = await headers();
	const forwarded = requestHeaders.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return requestHeaders.get("x-real-ip")?.trim() || "unknown";
}
