import { type ClientEnv, clientSchema } from "./schema";

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
