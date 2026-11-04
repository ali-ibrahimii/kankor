import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "../env/client-env";
import type { Database } from "./database.types";

/**
 * Hard ceiling for a single Supabase HTTP request, in milliseconds.
 *
 * Keeps a stalled request (unreachable host, blocked egress, DNS blackhole)
 * from pinning the browser tab indefinitely — the query fails fast and the
 * surrounding React Query / component falls back to its empty state.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/** Browser-side Supabase client — use in Client Components only. */
export function createClient() {
	return createBrowserClient<Database>(
		clientEnv.supabase.url,
		clientEnv.supabase.publishableKey,
		{
			global: {
				fetch: (input, init) =>
					fetch(input, {
						...init,
						signal: AbortSignal.any([
							...(init?.signal ? [init.signal] : []),
							AbortSignal.timeout(REQUEST_TIMEOUT_MS),
						]),
					}),
			},
		}
	);
}
