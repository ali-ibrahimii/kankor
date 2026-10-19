import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getDashboardPath } from "@/lib/auth/auth.util";
import { getCurrentUser } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const code = searchParams.get("code");
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const nextParam = searchParams.get("next");
	const next =
		nextParam &&
		nextParam !== "null" &&
		nextParam !== "undefined" &&
		nextParam.trim() !== ""
			? nextParam
			: null;
	const fallbackNext = next ?? routes.home.page();
	const source = searchParams.get("source");

	const supabase = await createClient();
	// Create redirect link without the secret token
	const redirectTo = request.nextUrl.clone();
	try {
		const nextUrl = new URL(fallbackNext, request.url);
		redirectTo.pathname = nextUrl.pathname;
		for (const [key, val] of nextUrl.searchParams.entries()) {
			redirectTo.searchParams.set(key, val);
		}
	} catch {
		redirectTo.pathname = fallbackNext;
	}
	redirectTo.searchParams.delete("token_hash");
	redirectTo.searchParams.delete("type");
	redirectTo.searchParams.delete("code");
	redirectTo.searchParams.delete("next");

	// PKCE code exchange — used by OAuth providers (Google) and magic links
	if (code) {
		console.log("google login", code);
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			if (source === "mobile") return mobileVerifiedResponse();

			const user = await getCurrentUser();
			if (user) {
				if (type === "recovery" || (next && next.includes("reset-password"))) {
					redirectTo.pathname = routes.auth.resetPassword.page(undefined, {
						locale: user.locale,
					});
				} else if (next) {
					// keep redirectTo pathname as it is already configured with next's pathname and parameters
				} else {
					redirectTo.pathname = getDashboardPath(user);
				}
				return NextResponse.redirect(redirectTo);
			}
			return NextResponse.redirect(redirectTo);
		} else {
			redirectTo.searchParams.set("errorCode", error.code as string);
			redirectTo.searchParams.set("errorMsg", error.message);
		}
	}

	// Token hash exchange — used by email confirmation and magic-link templates
	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ token_hash, type });
		if (!error) {
			if (source === "mobile") return mobileVerifiedResponse();

			const user = await getCurrentUser();
			if (user) {
				if (type === "recovery" || (next && next.includes("reset-password"))) {
					redirectTo.pathname = routes.auth.resetPassword.page(undefined, {
						locale: user.locale,
					});
				} else if (next) {
					// keep redirectTo pathname as it is already configured with next's pathname and parameters
				} else {
					redirectTo.pathname = getDashboardPath(user);
				}
				return NextResponse.redirect(redirectTo);
			}
			return NextResponse.redirect(redirectTo);
		} else {
			redirectTo.searchParams.set("errorCode", error.code as string);
			redirectTo.searchParams.set("errorMsg", error.message);
		}
	}

	redirectTo.pathname = routes.auth.login.page();
	redirectTo.searchParams.set("error", "auth_error");
	return NextResponse.redirect(redirectTo);
}

/**
 * Serves an HTML page that immediately opens the mobile app via deep link.
 * Falls back to the web homepage if the app is not installed.
 */
function mobileVerifiedResponse() {
	const deepLink = `${serverEnv.app.androidAppSchema}://email-verified`;
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Verified – Abzar Kankor</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#010133;color:#fff;padding:24px;text-align:center;gap:12px}
    h2{font-size:1.4rem;font-weight:700}
    p{color:#a8aaaf;font-size:0.95rem;line-height:1.5}
    a{color:#3869d4;text-decoration:underline}
  </style>
</head>
<body>
  <h2>✓ Email Verified!</h2>
  <p>Opening Abzar Kankor…</p>
  <p>If the app doesn't open, <a href="/">tap here</a> to continue in the browser.</p>
  <script>
    window.location.href = '${deepLink}';
  </script>
</body>
</html>`;

	return new NextResponse(html, {
		status: 200,
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}
