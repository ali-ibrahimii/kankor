/**
 * Drops anything a previous (production) visit left behind on this origin:
 * service-worker registrations and their CacheStorage buckets.
 *
 * Dev chunks are unhashed, so a cached copy of them survives code changes and
 * the browser keeps evaluating an old module graph — Turbopack then reports
 * "module factory is not available". Only call this in development.
 */
export async function resetDevCache() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
		return;
	}

	const registrations = await navigator.serviceWorker.getRegistrations();
	await Promise.all(
		registrations.map((registration) => registration.unregister())
	);

	if (typeof caches !== "undefined") {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((name) => caches.delete(name)));
	}
}
