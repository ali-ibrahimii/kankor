"use client";

import {
	CheckCircle2,
	Download,
	PlusSquare,
	Share,
	Sparkles,
	X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "abzarkankor_pwa_prompt_dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function InstallPromptDialog() {
	const t = useTranslations("pwa");
	const [isOpen, setIsOpen] = useState(false);
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isIOS, setIsIOS] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);
	const [isInstalling, setIsInstalling] = useState(false);

	useEffect(() => {
		// Check standalone mode
		const inStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as unknown as { standalone?: boolean }).standalone ===
				true;

		setIsStandalone(inStandalone);
		if (inStandalone) return;

		// Check dismiss storage timer (24h)
		const lastDismissed = localStorage.getItem(DISMISS_KEY);
		if (
			lastDismissed &&
			Date.now() - Number(lastDismissed) < DISMISS_DURATION_MS
		) {
			return;
		}

		// Detect iOS
		const userAgent = window.navigator.userAgent.toLowerCase();
		const isIOSDevice =
			/iphone|ipad|ipod/.test(userAgent) &&
			!(window as unknown as { MSStream?: unknown }).MSStream;
		setIsIOS(isIOSDevice);

		if (isIOSDevice) {
			// Show iOS install prompt after a short delay on iOS
			const timer = setTimeout(() => setIsOpen(true), 2500);
			return () => clearTimeout(timer);
		}

		// Listen for standard browser beforeinstallprompt
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			// Trigger display after short delay
			setTimeout(() => setIsOpen(true), 2000);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;
		setIsInstalling(true);
		try {
			await deferredPrompt.prompt();
			const choiceResult = await deferredPrompt.userChoice;
			if (choiceResult.outcome === "accepted") {
				setIsOpen(false);
			}
		} catch (err) {
			console.error("PWA install error:", err);
		} finally {
			setIsInstalling(false);
			setDeferredPrompt(null);
		}
	};

	const handleDismiss = () => {
		setIsOpen(false);
		localStorage.setItem(DISMISS_KEY, Date.now().toString());
	};

	if (isStandalone || !isOpen) {
		return null;
	}

	return (
		<div className="fixed bottom-4 end-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96 overflow-hidden border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
			{/* Close X Button */}
			<button
				type="button"
				onClick={handleDismiss}
				className="absolute top-3 end-3 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
				aria-label="Close"
			>
				<X className="w-4 h-4" />
			</button>

			{/* Header Gradient Banner */}
			<div className="relative p-5 pb-4 bg-gradient-to-br from-primary/15 via-blue-500/10 to-transparent border-b border-border/40 overflow-hidden">
				<div className="absolute -top-10 -end-10 w-28 h-28 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

				<div className="flex items-center gap-3.5 pe-6">
					<div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border border-primary/20 flex-shrink-0 bg-background">
						<Image
							src="/web-app-manifest-192x192.png"
							alt="Abzar Kankor"
							width={48}
							height={48}
							className="object-cover w-full h-full"
						/>
					</div>

					<div className="space-y-0.5 flex-grow">
						<div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
							<Sparkles className="w-3 h-3" />
							<span>Offline Learning</span>
						</div>
						<h3 className="text-base font-bold text-foreground tracking-tight leading-snug">
							{t("installTitle")}
						</h3>
					</div>
				</div>

				<p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
					{t("installDescription")}
				</p>
			</div>

			{/* Feature Highlights & Actions */}
			<div className="p-4 space-y-3.5">
				<div className="space-y-2">
					<div className="flex items-center gap-2.5 text-xs text-foreground/90">
						<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
						<span>{t("feature1")}</span>
					</div>
					<div className="flex items-center gap-2.5 text-xs text-foreground/90">
						<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
						<span>{t("feature2")}</span>
					</div>
					<div className="flex items-center gap-2.5 text-xs text-foreground/90">
						<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
						<span>{t("feature3")}</span>
					</div>
				</div>

				{/* iOS Instructions block if on Safari iOS */}
				{isIOS && (
					<div className="mt-3 p-3 rounded-xl bg-muted/60 border border-border/80 space-y-2 text-xs text-muted-foreground">
						<div className="font-semibold text-foreground flex items-center gap-1 text-xs">
							<span>{t("iosInstructionsTitle")}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="p-1 rounded-md bg-background border border-border flex items-center justify-center text-primary">
								<Share className="w-3.5 h-3.5" />
							</div>
							<span>{t("iosStep1")}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="p-1 rounded-md bg-background border border-border flex items-center justify-center text-primary">
								<PlusSquare className="w-3.5 h-3.5" />
							</div>
							<span>{t("iosStep2")}</span>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="pt-1 flex gap-2">
					{!isIOS && deferredPrompt && (
						<Button
							onClick={handleInstallClick}
							disabled={isInstalling}
							size="sm"
							className="flex-1 font-semibold gap-1.5 shadow-sm shadow-primary/20 active:scale-[0.98] transition-transform text-xs"
						>
							<Download className="w-3.5 h-3.5" />
							{t("installButton")}
						</Button>
					)}

					<Button
						variant="outline"
						onClick={handleDismiss}
						size="sm"
						className={`font-medium text-xs ${!isIOS && deferredPrompt ? "" : "w-full"}`}
					>
						{t("maybeLater")}
					</Button>
				</div>
			</div>
		</div>
	);
}
