"use client";

import { BookOpen, Layers, RotateCw, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

export default function OfflinePage() {
	const t = useTranslations("offline");
	const [isRetrying, setIsRetrying] = useState(false);
	const [isOnline, setIsOnline] = useState(false);

	useEffect(() => {
		setIsOnline(navigator.onLine);

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const handleRetry = () => {
		setIsRetrying(true);
		setTimeout(() => {
			if (navigator.onLine) {
				window.location.reload();
			} else {
				setIsRetrying(false);
			}
		}, 1000);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 sm:p-6 relative overflow-hidden select-none">
			{/* Dynamic gradient background glows */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

			<div className="relative z-10 max-w-md w-full text-center space-y-8 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300">
				{/* Animated Visual Offline Badge */}
				<div className="relative mx-auto w-24 h-24 flex items-center justify-center">
					<div className="absolute inset-0 rounded-full bg-destructive/10 animate-ping opacity-75" />
					<div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20 flex items-center justify-center shadow-inner">
						<WifiOff className="w-10 h-10 text-destructive animate-pulse" />
					</div>
				</div>

				{/* Title and Explanation */}
				<div className="space-y-3">
					<span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-muted border border-border text-muted-foreground">
						<span
							className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-destructive animate-pulse"}`}
						/>
						{isOnline ? t("statusOnline") : t("statusOffline")}
					</span>

					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
						{t("title")}
					</h1>

					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						{t("subtitle")}
					</p>
				</div>

				{/* Main Action - Retry */}
				<div className="pt-2">
					<Button
						onClick={handleRetry}
						disabled={isRetrying}
						size="lg"
						className="w-full font-semibold gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
					>
						<RotateCw
							className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
						/>
						{t("retryButton")}
					</Button>
				</div>

				<div className="relative flex py-1 items-center">
					<div className="flex-grow border-t border-border/60" />
					<span className="flex-shrink mx-3 text-xs text-muted-foreground">
						Available Offline
					</span>
					<div className="flex-grow border-t border-border/60" />
				</div>

				{/* Navigation Links to Offline Cached Modules */}
				<div className="grid grid-cols-2 gap-3 pt-1">
					<Link
						href={routes.d.decks.page()}
						className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-accent hover:border-accent-foreground/20 transition-all text-center gap-2"
					>
						<div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
							<Layers className="w-5 h-5" />
						</div>
						<span className="text-xs font-medium text-foreground">
							{t("goFlashcards")}
						</span>
					</Link>

					<Link
						href={routes.d.library.page()}
						className="group flex flex-col items-center justify-center p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-accent hover:border-accent-foreground/20 transition-all text-center gap-2"
					>
						<div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
							<BookOpen className="w-5 h-5" />
						</div>
						<span className="text-xs font-medium text-foreground">
							{t("goLibrary")}
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
