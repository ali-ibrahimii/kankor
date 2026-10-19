"use client";

import { useEffect } from "react";
import { InstallPromptDialog } from "./install-prompt-dialog";
import { OfflineIndicator } from "./offline-indicator";

export function PWAProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		// In development, unregister any cached service workers so unhashed
		// dev chunks are never served stale from CacheStorage.
		if (process.env.NODE_ENV !== "production") {
			navigator.serviceWorker
				.getRegistrations()
				.then((registrations) => {
					for (const registration of registrations) {
						registration.unregister();
					}
				})
				.catch(() => {});
			return;
		}

		navigator.serviceWorker
			.register("/sw.js", {
				scope: "/",
				updateViaCache: "none",
			})
			.then((registration) => {
				registration.onupdatefound = () => {
					const installingWorker = registration.installing;
					if (installingWorker) {
						installingWorker.onstatechange = () => {
							if (installingWorker.state === "installed") {
								if (navigator.serviceWorker.controller) {
									console.log("New content available; please refresh.");
								}
							}
						};
					}
				};
			})
			.catch((error) => {
				console.error("Service worker registration error:", error);
			});
	}, []);

	return (
		<>
			{children}
			<OfflineIndicator />
			<InstallPromptDialog />
		</>
	);
}
