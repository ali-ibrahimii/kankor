import { type ClientEnv, clientSchema } from "./schema";

// Read the raw values once: Next inlines `NEXT_PUBLIC_*` at build time, so
// this stays a compile-time constant in client bundles.
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when real Supabase credentials are configured.
 *
 * The public website and the isolated `/demo` dashboard can run without
 * Supabase credentials (see the inert `demo.invalid` fallback below). Anything
 * that would hit the network — the auth provider above all — must check this
 * flag first instead of firing requests at a host that cannot resolve.
 */
export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseKey);

/**
 * True when the configured Supabase URL is a real, reachable Supabase
 * project — not the inert `demo.invalid` / `example.invalid` placeholders.
 *
 * `isSupabaseConfigured` only checks that *some* value was provided. A
 * deployment (or a copied `.env`) can still point at a placeholder host, and
 * every `supabase.auth.getClaims()` / `.from(...)` call against it blocks on a
 * DNS lookup that never resolves — which in practice means a multi-minute
 * request hang rather than a fast, actionable error.
 *
 * Server-side code paths (middleware, Server Components, Server Actions) must
 * use this check before touching the network; the client-only
 * `isSupabaseConfigured` flag is not enough.
 */
export function isRealSupabaseUrl(url: string | undefined): boolean {
	if (!url) return false;
	return (
		!url.includes("demo.invalid") &&
		!url.includes("example.invalid") &&
		/^https?:\/\//.test(url)
	);
}

function parseClientEnv(): ClientEnv {
	const env = {
		app: {
			name: process.env.NEXT_PUBLIC_APP_NAME,
			address: process.env.NEXT_PUBLIC_SITE_URL,
			email: process.env.NEXT_PUBLIC_APP_EMAIL,
			androidAppSchema: process.env.NEXT_PUBLIC_ANDROID_APP_SCHEMA,
		},
		supabase: {
			// The public website and the isolated /demo dashboard can run without
			// Supabase credentials. An inert URL/key keeps the existing auth provider
			// bootable; protected /d routes still require a real signed session.
			url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.invalid",
			publishableKey:
				process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
				"demo-only-no-supabase-credentials",
			secretKey: "not-supported-in-client-env",
		},
		firebaseVapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
		clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || undefined,
	};

	return clientSchema.parse(env);
}

export const clientEnv = parseClientEnv();
