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
			url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
			publishableKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			secretKey: "not-supported-in-client-env",
		},
		firebaseVapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
		clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || undefined,
	};

	return clientSchema.parse(env);
}

export const clientEnv = parseClientEnv();
