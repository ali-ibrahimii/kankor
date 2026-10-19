"use client";

import { useEffect } from "react";
import { InstallPromptDialog } from "./install-prompt-dialog";
import { OfflineIndicator } from "./offline-indicator";

export function PWAProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (typeof window !== "undefined" && "serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("/sw.js", {
					scope: "/",
					updateViaCache: "none",
				})
				.then((registration) => {
					// Check for service worker updates periodically
					registration.onupdatefound = () => {
						const installingWorker = registration.installing;
						if (installingWorker) {
							installingWorker.onstatechange = () => {
								if (installingWorker.state === "installed") {
									if (navigator.serviceWorker.controller) {
										console.log("New content available; please refresh.");
									} else {
										console.log("Content cached for offline use.");
									}
								}
							};
						}
					};
				})
				.catch((error) => {
					console.error("Service worker registration error:", error);
				});
		}
	}, []);

	return (
		<>
			{children}
			<OfflineIndicator />
			<InstallPromptDialog />
		</>
	);
}
