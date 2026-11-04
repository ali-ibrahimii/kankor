import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "../env/server-env";
import type { Database } from "./database.types";

/**
 * Hard ceiling for a single Supabase HTTP request, in milliseconds.
 *
 * Without this, a request against an unreachable host (wrong project URL,
 * blocked egress, DNS blackhole) blocks on the underlying socket until the OS
 * gives up — which in practice means a request that hangs for minutes instead
 * of failing fast. A 10s ceiling keeps the page responsive and lets the
 * surrounding code fall back to its empty/placeholder state.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Wraps `fetch` with an `AbortSignal` so every Supabase HTTP call is bounded
 * by {@link REQUEST_TIMEOUT_MS}.
 *
 * `supabase-js` reads the signal from `RequestInit.signal`, so passing it
 * through the global `fetch` covers both auth and PostgREST calls without
 * touching the client internals.
 */
function withTimeout(init: RequestInit = {}): RequestInit {
	const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

	// If the caller already supplied a signal, honour whichever fires first.
	const signals = init.signal ? [init.signal, timeoutSignal] : [timeoutSignal];

	return { ...init, signal: AbortSignal.any(signals) };
}

/**
 * Server-side Supabase client — use in Server Components, Server Actions,
 * and Route Handlers. Reads the user's session from cookies and respects RLS.
 */
export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient<Database>(
		serverEnv.supabase.url,
		serverEnv.supabase.publishableKey,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(
					cookiesToSet: {
						name: string;
						value: string;
						options: CookieOptions;
					}[]
				) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options);
						});
					} catch {
						// Called from a Server Component render — safe to ignore.
						// The middleware (lib/supabase/middleware.ts) refreshes the
						// session cookie on every request, so this only matters for
						// Server Actions / Route Handlers, where cookies() IS writable.
					}
				},
			},
			global: {
				fetch: (input, init) => fetch(input, withTimeout(init)),
			},
		}
	);
}

/**
 * Service-role client — bypasses RLS entirely. Only use server-side for
 * trusted admin operations (e.g. approving a pending school/instructor
 * signup). Never import this in anything that runs in the browser.
 */
export function createServiceRoleClient() {
	return createServerClient<Database>(
		serverEnv.supabase.url,
		serverEnv.supabase.secretKey,
		{
			cookies: {
				getAll() {
					return [];
				},
				setAll() {
					// no-op — service-role client doesn't manage a user session
				},
			},
			global: {
				fetch: (input, init) => fetch(input, withTimeout(init)),
			},
		}
	);
}
