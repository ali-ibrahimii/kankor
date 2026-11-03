/**
 * Redirect safety for `?next=` parameters.
 *
 * The login form does `window.location.href = nextPath`, and the OAuth callback
 * forwards `next` to the same field. Accepting an absolute URL there turns the
 * app into an open redirect: `/auth/login?next=https://evil.example` sends a
 * user who just typed their password straight to an attacker's look-alike page.
 *
 * Only same-origin, root-relative paths are allowed. Protocol-relative values
 * (`//evil.com`), backslash variants (`/\evil.com`, which browsers normalise to
 * `//`), absolute URLs and `javascript:`/`data:` schemes all fall back.
 */
export function safeNextPath(
	raw: string | null | undefined,
	fallback = "/"
): string {
	if (!raw) return fallback;

	const value = raw.trim();
	if (value === "") return fallback;
	// Must be a root-relative path — "\" and "//" are treated as absolute by
	// the URL parser in some browsers, so reject anything that is not a plain
	// single-slash path.
	if (!value.startsWith("/") || value.startsWith("//")) return fallback;
	if (value.includes("\\")) return fallback;
	// Control characters and whitespace can hide a second scheme ("/ java\nscript:").
	// biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting them is the point
	if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

	// Resolve against a fixed sentinel origin and require it to stay put.
	try {
		const url = new URL(value, "https://next.invalid");
		if (url.origin !== "https://next.invalid") return fallback;
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return fallback;
	}
}
