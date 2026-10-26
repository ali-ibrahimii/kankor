// A dev or preview origin must never be served by a cached worker: Turbopack
// keeps chunk URLs stable while their content changes, so a worker answering
// from CacheStorage hands the browser an outdated module graph.
const IS_DEV_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$|(^|\.)e2b\.app$/.test(
	self.location.hostname
);

if (IS_DEV_HOST) {
	// Self-destruct: drop every bucket, then unregister this worker.
	self.addEventListener("install", () => self.skipWaiting());
	self.addEventListener("activate", (event) => {
		event.waitUntil(
			(async () => {
				const names = await caches.keys();
				await Promise.all(names.map((name) => caches.delete(name)));
				await self.registration.unregister();
				const controlled = await self.clients.matchAll({ type: "window" });
				for (const client of controlled) client.navigate(client.url);
			})()
		);
	});
}

// Production-only registration of the handlers below.
const on = (type, handler) => {
	if (!IS_DEV_HOST) self.addEventListener(type, handler);
};

// Bump this to invalidate every bucket from an earlier worker version.
const CACHE_NAME = "abzarkankor-v2";

// Only long-lived, content-hashed assets are worth storing. Dev chunks are
// unhashed and change on every edit, so caching them serves stale modules.
function isImmutableAsset(response) {
	const cacheControl = response.headers.get("cache-control") || "";
	return (
		cacheControl.includes("immutable") ||
		/max-age=(31536000|[3-9][0-9]{6,})/.test(cacheControl)
	);
}
const OFFLINE_URL = "/offline";

const PRECACHE_ASSETS = [
	OFFLINE_URL,
	"/favicon-96x96.png",
	"/web-app-manifest-192x192.png",
	"/web-app-manifest-512x512.png",
	"/apple-touch-icon.png",
];

// Install Event - Pre-cache essential resources
on("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				return cache.addAll(PRECACHE_ASSETS);
			})
			.then(() => self.skipWaiting())
	);
});

// Activate Event - Clean up stale caches
on("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_NAME)
						.map((name) => caches.delete(name))
				);
			})
			.then(() => self.clients.claim())
	);
});

// Fetch Event - Dynamic handling for offline fallback
on("fetch", (event) => {
	// Skip non-GET requests or browser extension requests
	if (
		event.request.method !== "GET" ||
		!event.request.url.startsWith(self.location.origin)
	) {
		return;
	}

	// Handle HTML document navigation requests
	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request).catch(async () => {
				const cache = await caches.open(CACHE_NAME);
				const cachedOfflinePage = await cache.match(OFFLINE_URL);
				if (cachedOfflinePage) {
					return cachedOfflinePage;
				}
				return new Response("Offline", {
					status: 533,
					statusText: "Service Unavailable",
					headers: { "Content-Type": "text/html" },
				});
			})
		);
		return;
	}

	// Handle static assets with Stale-While-Revalidate pattern
	if (
		event.request.destination === "style" ||
		event.request.destination === "script" ||
		event.request.destination === "image" ||
		event.request.destination === "font"
	) {
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				const fetchPromise = fetch(event.request)
					.then((networkResponse) => {
						if (
							networkResponse &&
							networkResponse.status === 200 &&
							isImmutableAsset(networkResponse)
						) {
							const responseToCache = networkResponse.clone();
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(event.request, responseToCache);
							});
						}
						return networkResponse;
					})
					.catch(() => cachedResponse);

				return cachedResponse || fetchPromise;
			})
		);
		return;
	}
});

// Push Notifications Listener
on("push", (event) => {
	if (event.data) {
		try {
			const data = event.data.json();
			const options = {
				body: data.body || "",
				icon: data.icon || "/web-app-manifest-192x192.png",
				badge: data.badge || "/favicon-96x96.png",
				vibrate: [100, 50, 100],
				data: {
					url: data.url || "/",
					dateOfArrival: Date.now(),
				},
			};
			event.waitUntil(
				self.registration.showNotification(
					data.title || "Abzar Kankor",
					options
				)
			);
		} catch (_e) {
			const text = event.data.text();
			event.waitUntil(
				self.registration.showNotification("Abzar Kankor", {
					body: text,
					icon: "/web-app-manifest-192x192.png",
				})
			);
		}
	}
});

// Notification Click Event Listener
on("notificationclick", (event) => {
	event.notification.close();
	const targetUrl = event.notification.data?.url || "/";

	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((windowClients) => {
				for (const client of windowClients) {
					if (client.url === targetUrl && "focus" in client) {
						return client.focus();
					}
				}
				if (clients.openWindow) {
					return clients.openWindow(targetUrl);
				}
			})
	);
});
