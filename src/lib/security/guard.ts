import { NextResponse } from "next/server";
import { timingSafeStringEqual } from "./secret";

/**
 * Route-handler guards — small, composable checks shared by every internal
 * API route (cron, database webhooks, the OMR bridge…).
 */

/** True when `Authorization: Bearer <token>` matches `secret`. */
export function hasBearerSecret(request: Request, secret: string): boolean {
	const header = request.headers.get("authorization") ?? "";
	const [scheme, token] = header.split(" ");
	if (scheme?.toLowerCase() !== "bearer" || !token) return false;
	return timingSafeStringEqual(token, secret);
}

/**
 * Standard 401/503 gate for routes protected by a shared secret.
 * Returns `null` when the request may proceed, otherwise a ready response.
 */
export function requireBearerSecret(
	request: Request,
	secret: string | undefined,
	options: { serviceName: string }
): NextResponse | null {
	if (!secret) {
		return NextResponse.json(
			{ error: `${options.serviceName} is not configured` },
			{ status: 503 }
		);
	}
	if (!hasBearerSecret(request, secret)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	return null;
}

/** Standard 429 response carrying `Retry-After`. */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
	return NextResponse.json(
		{ error: "Too many requests" },
		{
			status: 429,
			headers: { "Retry-After": String(retryAfterSeconds) },
		}
	);
}
