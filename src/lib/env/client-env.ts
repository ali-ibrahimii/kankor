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
