import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "../env/client-env";
import type { Database } from "./database.types";

/** Browser-side Supabase client — use in Client Components only. */
export function createClient() {
	return createBrowserClient<Database>(
		clientEnv.supabase.url,
		clientEnv.supabase.publishableKey
	);
}
