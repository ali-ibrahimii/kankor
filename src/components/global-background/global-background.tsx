"use client";

// src/components/global-background/global-background.tsx

import { cn } from "@/lib/utils";

interface GlobalBackgroundProps {
	className?: string;
}

export function GlobalBackground({ className }: GlobalBackgroundProps) {
	return (
		<div
			className={cn(
				"fixed inset-0 -z-10 overflow-hidden",
				// Light mode background
				"bg-gradient-to-br from-slate-50 via-white to-blue-50",
				// Dark mode background
				"dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950",
				className
			)}
			aria-hidden="true"
		>
			{/* Animated Gradient Orbs - Light Mode */}
			<div className="absolute inset-0 dark:opacity-0 transition-opacity duration-500">
				<div className="absolute top-0 -left-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl animate-pulse" />
				<div
					className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-purple-200/25 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			{/* Animated Gradient Orbs - Dark Mode */}
			<div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
				<div className="absolute top-0 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
				<div
					className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			{/* Pattern Overlay - Dots */}
			<div
				className={cn(
					"absolute inset-0 opacity-[0.015] dark:opacity-[0.03]",
					"bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_1px,transparent_1px)]",
					"dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)]",
					"bg-[length:24px_24px]"
				)}
			/>

			{/* Grid Pattern - Very Subtle */}
			<div
				className={cn(
					"absolute inset-0 opacity-[0.02] dark:opacity-[0.04]",
					"bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)]",
					"dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]",
					"bg-[length:100px_100px]"
				)}
			/>

			{/* Vignette Effect */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)]" />
		</div>
	);
}
