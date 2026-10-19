"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
	const t = useTranslations("offline");
	const [isOffline, setIsOffline] = useState(false);
	const [showRestoredMessage, setShowRestoredMessage] = useState(false);

	useEffect(() => {
		// Initial check
		if (typeof window !== "undefined") {
			setIsOffline(!navigator.onLine);
		}

		const handleOffline = () => {
			setIsOffline(true);
			setShowRestoredMessage(false);
		};

		const handleOnline = () => {
			setIsOffline(false);
			setShowRestoredMessage(true);
			const timer = setTimeout(() => {
				setShowRestoredMessage(false);
			}, 4000);
			return () => clearTimeout(timer);
		};

		window.addEventListener("offline", handleOffline);
		window.addEventListener("online", handleOnline);

		return () => {
			window.removeEventListener("offline", handleOffline);
			window.removeEventListener("online", handleOnline);
		};
	}, []);

	if (!isOffline && !showRestoredMessage) {
		return null;
	}

	return (
		<div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-center gap-2 text-xs sm:text-sm font-medium">
			{isOffline ? (
				<div className="flex items-center gap-2 text-destructive-foreground bg-destructive/90 border-destructive/50 px-3 py-1.5 rounded-full shadow-inner">
					<WifiOff className="w-4 h-4 animate-pulse" />
					<span>{t("bannerText")}</span>
				</div>
			) : (
				<div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-100 bg-emerald-500/90 border-emerald-400/50 px-3 py-1.5 rounded-full shadow-inner">
					<Wifi className="w-4 h-4" />
					<span>{t("bannerRestored")}</span>
				</div>
			)}
		</div>
	);
}
