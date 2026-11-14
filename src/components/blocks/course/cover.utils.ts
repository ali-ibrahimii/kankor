function imageHostPatterns(): RegExp[] {
	return (process.env.NEXT_PUBLIC_IMAGE_REMOTE_PATTERNS ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.map((pattern) => {
			const [host, path] = pattern.split("/");
			const hostRegex = new RegExp(
				`^${host.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`
			);
			const pathRegex = path
				? new RegExp(`^/${path.replace(/\*/g, ".*")}`)
				: null;
			return [hostRegex, pathRegex] as const;
		})
		.map(([hostRegex, pathRegex]) =>
			pathRegex
				? new RegExp(
						`${hostRegex.source.slice(0, -1)}${pathRegex.source.slice(1)}`
					)
				: new RegExp(`${hostRegex.source.slice(0, -1)}(/.*)?$`)
		);
}

function r2PublicHost(): string | null {
	const host = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME?.trim();
	if (!host) return null;
	return host.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function matchesConfiguredImageHosts(url: URL): boolean {
	const patterns = imageHostPatterns();
	if (patterns.length > 0) {
		const full = `${url.host}${url.pathname}`;
		if (patterns.some((re) => re.test(full))) return true;
	}

	const hostname = url.hostname.toLowerCase();
	const r2Host = r2PublicHost()?.toLowerCase();
	if (r2Host && (hostname === r2Host || hostname.endsWith(`.${r2Host}`))) {
		return true;
	}

	return hostname === "placehold.co";
}

/**
 * Whether the URL is served from a host the app trusts (R2 public bucket URL
 * or configured `NEXT_PUBLIC_IMAGE_REMOTE_PATTERNS`). It does NOT decide if
 * the URL renders — `resolveCoverSrc` does. Use this to choose between
 * `next/image` (only safe hosts) and a plain `<img>` (everything else).
 */
export function isNextImageSafe(url: string | null | undefined): url is string {
	if (!url) return false;
	const trimmed = url.trim();
	if (!trimmed) return false;
	if (trimmed.startsWith("/")) return true;
	try {
		return matchesConfiguredImageHosts(new URL(trimmed));
	} catch {
		return false;
	}
}

/**
 * Returns a usable image src for a cover URL, or null when there is no
 * usable image (empty / malformed / unsupported scheme). Any valid
 * http(s) URL is usable — un-allowlisted hosts simply render through the
 * plain-`<img>` fallback of `CoverFillImage` instead of `next/image`
 * (which throws for hosts missing from `images.remotePatterns`).
 */
export function resolveCoverSrc(url: string | null | undefined): string | null {
	if (!url) return null;
	const trimmed = url.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith("/")) return trimmed;
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol === "http:" || parsed.protocol === "https:") {
			return trimmed;
		}
		return null;
	} catch {
		return null;
	}
}

const COVER_PLACEHOLDER_GRADIENTS = [
	"bg-gradient-to-br from-rose-300 via-orange-200 to-amber-200",
	"bg-gradient-to-br from-rose-200 via-pink-200 to-purple-200",
	"bg-gradient-to-br from-violet-200 via-sky-200 to-blue-200",
	"bg-gradient-to-br from-teal-200 via-emerald-200 to-lime-200",
	"bg-gradient-to-br from-indigo-200 via-purple-200 to-rose-200",
	"bg-gradient-to-br from-cyan-200 via-sky-200 to-indigo-200",
	"bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200",
	"bg-gradient-to-br from-lime-200 via-emerald-200 to-teal-200",
] as const;

export function coverPlaceholderClass(key: string): string {
	let hash = 0;
	for (let i = 0; i < key.length; i += 1) {
		hash = (hash << 5) - hash + key.charCodeAt(i);
		hash |= 0;
	}
	return (
		COVER_PLACEHOLDER_GRADIENTS[
			Math.abs(hash) % COVER_PLACEHOLDER_GRADIENTS.length
		] ?? ""
	);
}
