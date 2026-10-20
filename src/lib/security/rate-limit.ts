/**
 * Sliding-window rate limiter (in-memory, dependency-free).
 *
 * Runs per Node instance — on Vercel serverless each instance keeps its own
 * window, so this is best-effort abuse protection, not a hard quota. It still
 * stops credential stuffing, signup spam, and endpoint hammering from a single
 * client far below the thresholds that matter. For a hard global quota add an
 * edge/WAF rule or a shared store (Upstash/Vercel KV) behind the same API.
 */

export type RateLimitRule = {
	/** Length of the sliding window, in milliseconds. */
	windowMs: number;
	/** Maximum number of requests allowed inside the window. */
	max: number;
};

export type RateLimitResult = {
	ok: boolean;
	/** Requests still available in the current window. */
	remaining: number;
	/** Seconds the caller must wait before retrying (0 when `ok`). */
	retryAfterSeconds: number;
};

type Window = {
	/** Timestamps of the requests that fall inside the current window. */
	hits: number[];
};

const windows = new Map<string, Window>();

/** Safety valve: never let the map grow unbounded on a long-lived process. */
const MAX_TRACKED_KEYS = 10_000;

/** Sensible defaults for unauthenticated, user-facing endpoints. */
export const DEFAULT_ABUSE_RULE: RateLimitRule = {
	windowMs: 60_000,
	max: 30,
};

/** Stricter rule for credential endpoints (login, password reset…). */
export const AUTH_ABUSE_RULE: RateLimitRule = {
	windowMs: 15 * 60_000,
	max: 10,
};

/**
 * Records one hit for `key` and reports whether it is allowed.
 * Callers should treat `ok: false` as HTTP 429.
 */
export function rateLimit(key: string, rule: RateLimitRule): RateLimitResult {
	const now = Date.now();
	const cutoff = now - rule.windowMs;

	const window = windows.get(key) ?? { hits: [] };
	// Drop timestamps that fell out of the window.
	window.hits = window.hits.filter((t) => t > cutoff);

	if (window.hits.length >= rule.max) {
		const oldest = window.hits[0];
		const retryAfterMs = Math.max(oldest + rule.windowMs - now, 0);
		windows.set(key, window);
		return {
			ok: false,
			remaining: 0,
			retryAfterSeconds: Math.ceil(retryAfterMs / 1000) || 1,
		};
	}

	window.hits.push(now);
	windows.set(key, window);

	if (windows.size > MAX_TRACKED_KEYS) {
		evictExpired(now);
	}

	return {
		ok: true,
		remaining: rule.max - window.hits.length,
		retryAfterSeconds: 0,
	};
}

/** Clears expired windows when the map overflows. */
function evictExpired(now: number): void {
	for (const [key, window] of windows) {
		if (window.hits.every((t) => t <= now - 60 * 60_000)) {
			windows.delete(key);
		}
		if (windows.size <= MAX_TRACKED_KEYS / 2) break;
	}
}

/** Test hook — drops all tracked windows. */
export function resetRateLimits(): void {
	windows.clear();
}

/** Builds a namespaced key: `login:203.0.113.9:alice@example.com`. */
export function rateLimitKey(...parts: string[]): string {
	return parts.map((p) => p.trim().toLowerCase().slice(0, 120)).join(":");
}

/**
 * Extracts the best-effort client IP from a request. Vercel/proxies set
 * `x-forwarded-for` (first hop wins); direct sockets fall back to
 * `x-real-ip` or an unknown marker so shared keys stay distinct per host.
 */
export function getClientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return request.headers.get("x-real-ip")?.trim() || "unknown";
}
