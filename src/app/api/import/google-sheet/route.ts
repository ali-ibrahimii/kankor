import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimitResponse } from "@/lib/security/guard";
import {
	AUTH_ABUSE_RULE,
	getClientIp,
	rateLimit,
	rateLimitKey,
} from "@/lib/security/rate-limit";

const SHEET_ID_PATTERN = /docs\.google\.com\/spreadsheets\/d\/([\w-]+)/;
const GID_PATTERN = /[?&#]gid=(\d+)/;

/**
 * Proxies a public Google Sheets URL as CSV text.
 *
 * Fetching Google's CSV export endpoint directly from the browser is blocked
 * by CORS, so the generic import engine routes it through this server-side
 * handler instead. This route is intentionally domain-agnostic — it knows
 * nothing about which table the caller intends to import into.
 *
 * Auth: restricted to signed-in staff (admin / instructor / school members)
 * and rate-limited — an open proxy would otherwise be an abuse magnet.
 */
export async function POST(request: Request) {
	const user = await getCurrentUser();
	const isStaff =
		user?.role === "admin" ||
		user?.role === "instructor" ||
		(user?.schoolMemberships?.length ?? 0) > 0;

	if (!user || !isStaff) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const limit = rateLimit(
		rateLimitKey("google-sheet-import", getClientIp(request), user.id),
		AUTH_ABUSE_RULE
	);
	if (!limit.ok) {
		return rateLimitResponse(limit.retryAfterSeconds);
	}

	const body = await request.json().catch(() => null);
	const url = typeof body?.url === "string" ? body.url : null;

	if (!url) {
		return NextResponse.json(
			{ error: "A Google Sheets URL is required." },
			{ status: 400 }
		);
	}

	const sheetIdMatch = url.match(SHEET_ID_PATTERN);
	if (!sheetIdMatch) {
		return NextResponse.json(
			{ error: "That doesn't look like a Google Sheets URL." },
			{ status: 400 }
		);
	}

	const sheetId = sheetIdMatch[1];
	const gid = url.match(GID_PATTERN)?.[1] ?? "0";
	const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

	let response: Response;
	try {
		response = await fetch(exportUrl);
	} catch {
		return NextResponse.json(
			{ error: "Could not reach Google Sheets. Check the URL and try again." },
			{ status: 502 }
		);
	}

	if (!response.ok) {
		return NextResponse.json(
			{
				error:
					'Could not download this sheet. Make sure sharing is set to "Anyone with the link".',
			},
			{ status: 502 }
		);
	}

	const text = await response.text();
	return NextResponse.json({ text });
}
