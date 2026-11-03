/**
 * Security headers for every HTML/document response.
 *
 * The CSP is intentionally strict but still allows everything the app needs:
 * Supabase (API/auth/storage + realtime), Firebase-hosted course images,
 * Cloudflare R2 media, YouTube embeds, Sentry (via the /monitoring tunnel),
 * Vercel Analytics, Microsoft Clarity, and the camera QR scanner
 * (Permissions-Policy keeps `camera` open only to first-party use).
 */

type Header = { key: string; value: string };

const isDev = process.env.NODE_ENV !== "production";

// The local dev server is embedded by the hosted preview environment, so the
// dev CSP has to allow that one frame ancestor. Production stays locked down.
const DEV_FRAME_ANCESTORS = ["'self'", "https://*.e2b.app"];

const CSP_DIRECTIVES: Record<string, string[]> = {
	"default-src": ["'self'"],
	"base-uri": ["'self'"],
	"object-src": ["'none'"],
	"form-action": ["'self'"],
	"frame-ancestors": isDev ? DEV_FRAME_ANCESTORS : ["'none'"],
	"script-src": [
		"'self'",
		// Next.js injects small inline bootstrap/flight scripts.
		"'unsafe-inline'",
		...(isDev ? ["'unsafe-eval'"] : []),
		"https://www.clarity.ms",
	],
	"style-src": ["'self'", "'unsafe-inline'"],
	"img-src": [
		"'self'",
		"data:",
		"blob:",
		"https://*.supabase.co",
		"https://storage.googleapis.com",
		"https://*.r2.cloudflarestorage.com",
		"https://*.r2.dev",
		"https://*.clarity.ms",
	],
	"font-src": ["'self'", "data:"],
	"media-src": [
		"'self'",
		"blob:",
		"https://*.supabase.co",
		"https://*.r2.cloudflarestorage.com",
		"https://*.r2.dev",
	],
	"connect-src": [
		"'self'",
		"https://*.supabase.co",
		"wss://*.supabase.co",
		"https://*.sentry.io",
		"https://*.ingest.sentry.io",
		"https://vitals.vercel-insights.com",
		"https://*.vercel-insights.com",
		"https://www.clarity.ms",
		"https://*.clarity.ms",
		"https://*.bing.com",
		"https://*.r2.cloudflarestorage.com",
		"https://*.r2.dev",
	],
	"frame-src": [
		"'self'",
		"https://www.youtube.com",
		"https://www.youtube-nocookie.com",
		"https://player.vimeo.com",
	],
	"worker-src": ["'self'", "blob:"], // pdfjs-dist spawns blob workers
	"manifest-src": ["'self'"],
};

function buildCsp(): string {
	const directives = Object.entries(CSP_DIRECTIVES).map(
		([directive, sources]) =>
			sources.length > 0 ? `${directive} ${sources.join(" ")}` : directive
	);

	if (!isDev) {
		directives.push("upgrade-insecure-requests");
	}

	return directives.join("; ");
}

/**
 * The full header list applied to `/(.*)` in `next.config.ts`.
 * `X-Frame-Options`/HSTS are production-only only where dev over HTTP would
 * otherwise break (HSTS); frame denial is kept on in every environment.
 */
export function buildSecurityHeaders(): Header[] {
	const headers: Header[] = [
		{ key: "X-Content-Type-Options", value: "nosniff" },
		// frame-ancestors in the dev CSP above governs embedding there; the
		// legacy X-Frame-Options header would override it in older browsers.
		...(isDev ? [] : [{ key: "X-Frame-Options", value: "DENY" } as const]),
		{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
		{
			key: "Permissions-Policy",
			// Camera stays enabled for the first-party QR scanner; everything
			// else sensitive is off.
			value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
		},
		{ key: "Content-Security-Policy", value: buildCsp() },
		{ key: "X-DNS-Prefetch-Control", value: "on" },
	];

	if (!isDev) {
		headers.push({
			key: "Strict-Transport-Security",
			value: "max-age=31536000; includeSubDomains",
		});
	}

	return headers;
}
