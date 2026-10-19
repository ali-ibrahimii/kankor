import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

// next-intl middleware handles:
//   • Redirecting / → /fa (default locale)
//   • Setting the NEXT_LOCALE cookie (sameSite=lax, 1 year) so returning
//     visitors land on their last-used locale instead of always the default
//   • Injecting the locale into RSC via request headers
const handleI18n = createIntlMiddleware(routing);
export async function proxy(request: NextRequest) {
	const { supabaseResponse, user } = await updateSession(request);
	// API routes must never have a locale prefix — skip i18n middleware entirely.
	if (request.nextUrl.pathname.startsWith("/api")) {
		return supabaseResponse;
	}

	const preferredLocale = user?.locale;

	let reqToUse = request;

	// If user has locale, force it via cookie override (next-intl reads this)
	if (preferredLocale) {
		const headers = new Headers(request.headers);
		headers.set(
			"cookie",
			`${request.headers.get("cookie") ?? ""}; NEXT_LOCALE=${preferredLocale}`
		);
		reqToUse = new NextRequest(request.url, { headers });
	}

	// Run next-intl middleware to handle localization
	const intlResponse = handleI18n(reqToUse);

	// If updateSession returned a redirect response (e.g. to /login or /d),
	// merge cookies and headers from intlResponse into supabaseResponse and return it.
	if (supabaseResponse.headers.has("location")) {
		for (const cookie of intlResponse.cookies.getAll()) {
			supabaseResponse.cookies.set(cookie.name, cookie.value, {
				httpOnly: cookie.httpOnly,
				secure: cookie.secure,
				sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
				maxAge: cookie.maxAge,
				path: cookie.path,
			});
		}
		intlResponse.headers.forEach((value, key) => {
			if (!supabaseResponse.headers.has(key)) {
				supabaseResponse.headers.set(key, value);
			}
		});
		return supabaseResponse;
	}

	// Otherwise, merge cookies and headers from supabaseResponse into intlResponse and return it.
	for (const cookie of supabaseResponse.cookies.getAll()) {
		intlResponse.cookies.set(cookie.name, cookie.value, {
			httpOnly: cookie.httpOnly,
			secure: cookie.secure,
			sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
			maxAge: cookie.maxAge,
			path: cookie.path,
		});
	}
	supabaseResponse.headers.forEach((value, key) => {
		if (!intlResponse.headers.has(key)) {
			intlResponse.headers.set(key, value);
		}
	});

	return intlResponse;
}

export const config = {
	matcher: [
		// Run on every path except Next.js internals, Vercel internals, and
		// any path containing a dot (public/ static assets: images, fonts, manifests, etc.)
		"/((?!_next|_vercel|.*\\..*).*)",
		"/",
	],
};
