import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { locales } from "@/i18n";
import { getDashboardPath } from "../auth/auth.util";
import { getCurrentUser } from "../auth/session";
import { CurrentUser } from "../auth/types";
import { serverEnv } from "../env/server-env";
import { routes } from "../routes";
import { Database } from "./database.types";

function isInAuthPage(pathname: string) {
	if (locales.some((l) => pathname.startsWith(`/${l}/auth/reset-password`))) {
		return false;
	}
	return locales.some((l) => `${pathname}/`.startsWith(`/${l}/auth/`));
}

function isInDashboardPage(pathname: string) {
	return locales.some((l) => `${pathname}/`.startsWith(`/${l}/d/`));
}

/**
 * Computes the "dashboard root" a pathname belongs to, mirroring the exact
 * shapes `getDashboardPath()` produces: `/{locale}/d`, `/{locale}/d/admin`,
 * `/{locale}/d/instructor`, `/{locale}/d/school/:id`, `/{locale}/d/agency/:id`.
 *
 * This exists because every one of those roots is nested under "/d" — so a
 * naive `pathname.startsWith(dashPath)` is a no-op for the student catch-all
 * root ("/d" itself): "/d/admin", "/d/instructor", and "/d/school/:other-id"
 * all start with "/d" too, letting any signed-in student load another
 * role's (or another school's) dashboard chrome outright. Comparing this
 * function's output against `dashPath` for equality closes that gap.
 */
function dashboardRootFor(pathname: string): string {
	const segments = pathname.split("/");
	const dIndex = segments.indexOf("d");
	if (dIndex === -1) return pathname;
	const roleSegment = segments[dIndex + 1];
	if (roleSegment === "admin" || roleSegment === "instructor") {
		return segments.slice(0, dIndex + 2).join("/");
	}
	if (roleSegment === "school" || roleSegment === "agency") {
		return segments.slice(0, dIndex + 3).join("/");
	}
	return segments.slice(0, dIndex + 1).join("/");
}

/**
 * Reads the locale directly off the request's first path segment.
 *
 * `updateSession` runs before next-intl's own middleware (see proxy.ts,
 * which calls `updateSession` first and only afterwards hands the request
 * to `createIntlMiddleware`), so `getLocale()` has no path-derived locale to
 * fall back on yet here — it resolves from the `NEXT_LOCALE` cookie only,
 * which is empty on a session's very first request. That made the
 * "make sure they're visiting their own dashboard" check below compare the
 * *actual* `/en/...` pathname against a `dashPath` computed for whatever
 * locale the (possibly absent) cookie implied — usually the default 'fa' —
 * and redirect away from a perfectly valid `/en/d/...` URL. Once redirected
 * once, the cookie locks in and every subsequent request repeats the bug.
 */
function localeFromPathname(
	pathname: string
): (typeof locales)[number] | undefined {
	const segment = pathname.split("/")[1];
	return locales.find((l) => l === segment);
}

/**
 * Refreshes the Supabase auth session on every request and returns the
 * current user so middleware.ts can make routing/role decisions.
 * Mirrors Supabase's documented App Router middleware pattern.
 */
export async function updateSession(
	request: NextRequest
): Promise<{ supabaseResponse: NextResponse; user?: CurrentUser | null }> {
	const pathname = request.nextUrl.pathname;
	let supabaseResponse = NextResponse.next({
		request,
	});

	if (!isInDashboardPage(pathname) && !isInAuthPage(pathname)) {
		return { supabaseResponse };
	}
	const supabase = createServerClient<Database>(
		serverEnv.supabase.url,
		serverEnv.supabase.publishableKey,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet, headers) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value)
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options)
					);
					Object.entries(headers).forEach(([key, value]) =>
						supabaseResponse.headers.set(key, value)
					);
				},
			},
		}
	);
	// Do not run code between createServerClient and
	// supabase.auth.getClaims(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.
	// IMPORTANT: If you remove getClaims() and you use server-side rendering
	// with the Supabase client, your users may be randomly logged out.
	const { data, error } = await supabase.auth.getClaims();

	const redirectTo = request.nextUrl.clone();
	const locale = localeFromPathname(pathname) ?? (await getLocale());
	if (data?.claims && !error) {
		// user is authenticated
		const user = await getCurrentUser();
		const dashPath = getDashboardPath(user, locale);

		if (!user) {
			// Profile row may not exist yet (trigger latency for brand-new users).
			// Allow auth pages through; for dashboard/protected routes let the page handle auth.
			if (isInAuthPage(pathname)) {
				// Redirect authenticated (claims exist) users away from auth pages to default dashboard
				const defaultDash = routes.d.page(undefined, { locale });
				redirectTo.pathname = defaultDash;
				return {
					supabaseResponse: NextResponse.redirect(redirectTo),
					user: null,
				};
			}

			return { supabaseResponse, user: null };
		}

		if (isInAuthPage(pathname)) {
			const nextParam = request.nextUrl.searchParams.get("next");
			if (nextParam) {
				try {
					const nextUrl = new URL(nextParam, request.url);
					if (nextUrl.host === request.nextUrl.host) {
						return { supabaseResponse: NextResponse.redirect(nextUrl), user };
					}
				} catch {
					// Invalid URL
				}
			}
			redirectTo.pathname = dashPath;
			return { supabaseResponse: NextResponse.redirect(redirectTo), user };
		}

		if (isInDashboardPage(pathname)) {
			// Make sure they're visiting their own dashboard root — see
			// dashboardRootFor()'s doc comment for why a plain prefix check
			// doesn't work here.
			if (dashboardRootFor(pathname) !== dashPath) {
				redirectTo.pathname = dashPath;
				return { supabaseResponse: NextResponse.redirect(redirectTo), user };
			}
		}

		return { supabaseResponse, user };
	} else {
		// user is not authenticated
		if (isInDashboardPage(pathname)) {
			// redirect to login page when visiting dashboard pages for unauthorized users
			const nextPath = request.nextUrl.pathname + request.nextUrl.search;
			const loginUrl = new URL(
				routes.auth.login.page({ next: nextPath }, { locale }),
				request.url
			);
			return { supabaseResponse: NextResponse.redirect(loginUrl) };
		}
	}

	return { supabaseResponse };
}
