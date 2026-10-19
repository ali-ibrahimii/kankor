"use client";

// src/components/ui/background-variants.tsx
// چند variant مختلف background

import { cn } from "@/lib/utils";

/* ==========================================================================
   Variant 1: Dots Pattern (ملایم و ساده)
   ========================================================================== */
export function DotsBackground({ className }: { className?: string }) {
	return (
		<div
			className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
			aria-hidden="true"
		>
			{/* Base Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />

			{/* Animated Orbs */}
			<div className="absolute inset-0">
				<div className="absolute top-0 -left-40 h-80 w-80 rounded-full bg-blue-200/30 dark:bg-indigo-500/10 blur-3xl animate-pulse" />
				<div
					className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-indigo-200/20 dark:bg-fuchsia-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-purple-200/25 dark:bg-sky-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			{/* Dots Pattern */}
			<div
				className={cn(
					"absolute inset-0 opacity-[0.015] dark:opacity-[0.03]",
					"bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_1px,transparent_1px)]",
					"dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)]",
					"bg-[length:24px_24px]"
				)}
			/>
		</div>
	);
}

/* ==========================================================================
   Variant 2: Grid Pattern (حرفه‌ای و مدرن)
   ========================================================================== */
export function GridBackground({ className }: { className?: string }) {
	return (
		<div
			className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
			aria-hidden="true"
		>
			{/* Base Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

			{/* Animated Orbs */}
			<div className="absolute inset-0">
				<div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-blue-300/20 dark:bg-blue-500/10 blur-3xl animate-pulse" />
				<div
					className="absolute bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "1.5s" }}
				/>
			</div>

			{/* Grid Pattern */}
			<div
				className={cn(
					"absolute inset-0 opacity-[0.03] dark:opacity-[0.05]",
					"bg-[linear-gradient(rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.15)_1px,transparent_1px)]",
					"dark:bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)]",
					"bg-[length:60px_60px]"
				)}
			/>

			{/* Fade Edges */}
			<div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/50 dark:from-slate-950/50 dark:via-transparent dark:to-slate-950/50" />
		</div>
	);
}

/* ==========================================================================
   Variant 3: Minimal (فقط gradient - بدون pattern)
   ========================================================================== */
export function MinimalBackground({ className }: { className?: string }) {
	return (
		<div
			className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
			aria-hidden="true"
		>
			{/* Base Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />

			{/* Subtle Orbs */}
			<div className="absolute inset-0">
				<div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-200/20 dark:bg-indigo-500/5 blur-3xl animate-pulse" />
				<div
					className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-200/20 dark:bg-fuchsia-500/5 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>
		</div>
	);
}

/* ==========================================================================
   Variant 4: Noise Texture (Premium feel)
   ========================================================================== */
export function NoiseBackground({ className }: { className?: string }) {
	return (
		<div
			className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
			aria-hidden="true"
		>
			{/* Base Gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

			{/* Animated Orbs */}
			<div className="absolute inset-0">
				<div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/25 dark:bg-indigo-500/10 blur-3xl animate-pulse" />
				<div
					className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/20 dark:bg-fuchsia-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
			</div>

			{/* Noise Texture - SVG based */}
			<svg className="absolute inset-0 h-full w-full opacity-[0.015] dark:opacity-[0.03]">
				<filter id="noise">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.9"
						numOctaves="4"
						stitchTiles="stitch"
					/>
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#noise)" />
			</svg>
		</div>
	);
}

/* ==========================================================================
   Variant 5: Mesh Gradient (مدرن و جذاب)
   ========================================================================== */
export function MeshBackground({ className }: { className?: string }) {
	return (
		<div
			className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
			aria-hidden="true"
		>
			{/* Base */}
			<div className="absolute inset-0 bg-white dark:bg-slate-950" />

			{/* Mesh Gradient Orbs */}
			<div className="absolute inset-0">
				<div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-300/30 to-transparent dark:from-blue-500/15 blur-3xl animate-pulse" />
				<div
					className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-indigo-300/25 to-transparent dark:from-indigo-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "0.5s" }}
				/>
				<div
					className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-purple-300/20 to-transparent dark:from-purple-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-gradient-to-tl from-pink-300/20 to-transparent dark:from-pink-500/10 blur-3xl animate-pulse"
					style={{ animationDelay: "1.5s" }}
				/>
			</div>

			{/* Subtle Dots */}
			<div
				className={cn(
					"absolute inset-0 opacity-[0.01] dark:opacity-[0.02]",
					"bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_1px,transparent_1px)]",
					"dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)]",
					"bg-[length:32px_32px]"
				)}
			/>
		</div>
	);
}
