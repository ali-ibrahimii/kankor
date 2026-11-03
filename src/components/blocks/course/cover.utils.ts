/**
 * Cover image handling for course cards/hero.
 *
 * next/image throws for any hostname not whitelisted in next.config
 * `images.remotePatterns` (seed data contains e.g. placehold.co URLs), so only
 * URLs from allowed hosts are rendered as images — anything else falls back to
 * a colored placeholder.
 */

// Mirrors images.remotePatterns in next.config.ts
const ALLOWED_COVER_HOSTS = ["storage.googleapis.com"];

/** Cloudflare R2 public host (custom domain or `pub-xxxx.r2.dev`), if configured. */
function r2PublicHost(): string | null {
	const host = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME?.trim();
	return host ? host.replace(/^https?:\/\//, "").replace(/\/+$/, "") : null;
}

/**
 * Returns the URL if next/image can render it, otherwise null.
 *
 * Covers uploaded through the app live in Cloudflare R2: either on the public
 * host (`NEXT_PUBLIC_R2_PUBLIC_HOSTNAME`) or, when that is unset, on the
 * same-origin `/api/media/...` proxy — both are accepted here.
 */
export function resolveCoverSrc(url: string | null | undefined): string | null {
	if (!url) return null;
	if (url.startsWith("/")) return url; // local/public assets + /api/media proxy
	try {
		const { hostname } = new URL(url);
		if (ALLOWED_COVER_HOSTS.includes(hostname)) return url;
		const r2Host = r2PublicHost();
		if (r2Host && hostname === r2Host) return url;
		if (hostname.endsWith(".r2.dev")) return url;
		return null;
	} catch {
		return null;
	}
}

// Static class strings so Tailwind's scanner picks them up
const PLACEHOLDER_GRADIENTS = [
	"bg-gradient-to-br from-sky-500 to-indigo-600",
	"bg-gradient-to-br from-emerald-500 to-teal-700",
	"bg-gradient-to-br from-amber-400 to-orange-600",
	"bg-gradient-to-br from-rose-400 to-pink-600",
	"bg-gradient-to-br from-violet-500 to-purple-700",
	"bg-gradient-to-br from-cyan-400 to-blue-600",
	"bg-gradient-to-br from-lime-500 to-green-700",
	"bg-gradient-to-br from-fuchsia-500 to-violet-600",
];

/**
 * Deterministic "random" placeholder color per course — seeded (by title/id)
 * so a course keeps the same color across renders and pages.
 */
export function coverPlaceholderClass(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}
