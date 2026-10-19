import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "../env/server-env";
import type { Database } from "./database.types";

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
		}
	);
}
